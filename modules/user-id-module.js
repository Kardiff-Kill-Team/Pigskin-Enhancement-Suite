const userIdModule = {
    async initialize() {
        this.addStyles();
        await this.createIdManager();
        
        if (window.location.pathname.includes('fbpicks')) {
            await this.setupFormAutoFill();
            await this.setupSaveReminder();
        }
    },

    addStyles() {
        uiUtils.addStyles(`
            .userid-panel {
                min-width: 250px;
            }

            .userid-input-group {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }

            .userid-history {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #dee2e6;
            }

            .userid-history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                margin: 2px 0;
                border-radius: 4px;
                background: #f8f9fa;
                font-size: 0.9em;
            }

            .userid-history-item:hover {
                background: #e9ecef;
            }

            .userid-status {
                font-size: 0.9em;
                margin-top: 5px;
                padding: 5px;
                border-radius: 4px;
            }

            .userid-status.success {
                background: #d4edda;
                color: #155724;
            }

            .userid-status.warning {
                background: #fff3cd;
                color: #856404;
            }

            .save-reminder-modal {
                text-align: center;
                padding: 20px;
            }

            .save-reminder-buttons {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 15px;
            }

            .userid-switch-container {
                display: flex;
                align-items: center;
                margin-top: 10px;
            }

            .userid-remember {
                margin-left: 10px;
                font-size: 0.9em;
            }
        `);
    },

    async createIdManager() {
        const panel = uiUtils.createPanel({
            top: '20px',
            left: '20px'
        });

        panel.className = 'userid-panel psm-panel';
        
        const savedId = await storageUtils.get('userId', '');
        const recentIds = await storageUtils.get('recentUserIds', []);
        
        panel.innerHTML = `
            <div class="psm-panel-header">
                <strong>User ID Manager</strong>
                <button class="psm-button collapse-btn" style="padding: 2px 6px;">_</button>
            </div>
            <div class="psm-panel-content">
                <div class="userid-input-group">
                    <input type="text" class="psm-input userid-input" 
                           placeholder="Enter your User ID" 
                           value="${savedId}">
                    <button class="psm-button save-btn" ${savedId ? 'disabled' : ''}>Save</button>
                </div>
                <div class="userid-status ${savedId ? 'success' : 'warning'}">
                    ${savedId ? 'ID Saved: ' + savedId : 'No ID saved'}
                </div>
                <div class="userid-switch-container">
                    <label class="userid-remember">
                        <input type="checkbox" ${await this.getAutoFillSetting() ? 'checked' : ''}>
                        Auto-fill ID on page load
                    </label>
                </div>
                ${this.renderRecentIds(recentIds)}
            </div>
        `;

        document.body.appendChild(panel);

        // Setup event listeners
        this.setupPanelListeners(panel);
    },

    renderRecentIds(recentIds) {
        if (!recentIds?.length) return '';

        return `
            <div class="userid-history">
                <strong>Recent IDs:</strong>
                ${recentIds.map(id => `
                    <div class="userid-history-item">
                        <span>${id}</span>
                        <button class="psm-button" data-id="${id}">Use</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    setupPanelListeners(panel) {
        // Collapse functionality
        const collapseBtn = panel.querySelector('.collapse-btn');
        const content = panel.querySelector('.psm-panel-content');
        collapseBtn.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            collapseBtn.textContent = content.style.display === 'none' ? '□' : '_';
        });

        // Input and save button
        const input = panel.querySelector('.userid-input');
        const saveBtn = panel.querySelector('.save-btn');
        const status = panel.querySelector('.userid-status');

        input.addEventListener('input', () => {
            const newId = input.value.trim();
            saveBtn.disabled = !newId;
        });

        saveBtn.addEventListener('click', async () => {
            const newId = input.value.trim();
            if (newId) {
                await this.saveUserId(newId);
                saveBtn.disabled = true;
                status.className = 'userid-status success';
                status.textContent = 'ID Saved: ' + newId;
                await this.updateRecentIds(newId);
                await this.refreshRecentIdsList(panel);
            }
        });

        // Auto-fill checkbox
        const checkbox = panel.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            this.setAutoFillSetting(checkbox.checked);
        });

        // Recent IDs buttons
        panel.querySelectorAll('.userid-history-item button').forEach(button => {
            button.addEventListener('click', async () => {
                const id = button.dataset.id;
                input.value = id;
                await this.saveUserId(id);
                status.className = 'userid-status success';
                status.textContent = 'ID Saved: ' + id;
                
                // Update form if on picks page
                const formInput = document.querySelector('input[name="id"]');
                if (formInput) {
                    formInput.value = id;
                }
            });
        });
    },

    async saveUserId(id) {
        await storageUtils.set('userId', id);
        await this.updateRecentIds(id);
    },

    async updateRecentIds(newId) {
        const recentIds = await storageUtils.get('recentUserIds', []);
        const updatedIds = [
            newId,
            ...recentIds.filter(id => id !== newId)
        ].slice(0, 5); // Keep only last 5 IDs
        await storageUtils.set('recentUserIds', updatedIds);
    },

    async refreshRecentIdsList(panel) {
        const recentIds = await storageUtils.get('recentUserIds', []);
        const historyContainer = panel.querySelector('.userid-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.renderRecentIds(recentIds);
            this.setupPanelListeners(panel); // Reattach event listeners
        }
    },

    async setupFormAutoFill() {
        if (!await this.getAutoFillSetting()) return;

        const savedId = await storageUtils.get('userId', '');
        if (!savedId) return;

        const idInput = document.querySelector('input[name="id"]');
        if (idInput) {
            idInput.value = savedId;
        }
    },

    async setupSaveReminder() {
        const form = document.querySelector('form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            const savedId = await storageUtils.get('userId', '');
            const formId = document.querySelector('input[name="id"]')?.value;

            if (formId && formId !== savedId) {
                e.preventDefault();
                this.showSaveReminder(formId, form);
            }
        });
    },

    showSaveReminder(newId, form) {
        const content = document.createElement('div');
        content.className = 'save-reminder-modal';
        content.innerHTML = `
            <h3>Save New ID?</h3>
            <p>Would you like to save "${newId}" as your default ID?</p>
            <div class="save-reminder-buttons">
                <button class="psm-button save">Save & Submit</button>
                <button class="psm-button skip" style="background: #6c757d;">Just Submit</button>
            </div>
        `;

        const modal = uiUtils.createModal(content);

        // Handle save and submit
        content.querySelector('.save').addEventListener('click', async () => {
            await this.saveUserId(newId);
            modal.close();
            form.submit();
        });

        // Handle skip and submit
        content.querySelector('.skip').addEventListener('click', () => {
            modal.close();
            form.submit();
        });
    },

    async getAutoFillSetting() {
        return await storageUtils.get('autoFillUserId', true);
    },

    async setAutoFillSetting(value) {
        await storageUtils.set('autoFillUserId', value);
    }
};

window.userIdModule = userIdModule;
