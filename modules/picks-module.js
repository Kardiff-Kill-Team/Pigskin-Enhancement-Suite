const picksModule = {
    async initialize() {
        if (!window.location.pathname.includes('fbpicks')) return;
        
        this.setupPicksForm();
        await this.checkGameTimes();
        this.addPicksPanel();
    },

    setupPicksForm() {
        const form = document.querySelector('form');
        if (!form) return;

        // Intercept form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate times
            const invalidGames = await this.checkGameTimes();
            if (invalidGames.length > 0) {
                this.showGameTimeWarning(invalidGames, form);
                return;
            }

            // Store picks before submission
            await this.storeCurrentPicks();
            form.submit();
        });

        // Add change listeners to dropdowns
        const dropdowns = document.querySelectorAll('select');
        dropdowns.forEach(dropdown => {
            if (!this.isLockDropdown(dropdown)) {
                dropdown.addEventListener('change', () => {
                    this.updatePicksDisplay();
                    window['lock-module']?.updateLockDropdown();
                });
            }
        });
    },

    async checkGameTimes() {
        const spreadsData = await storageUtils.get('currentSpreads');
        if (!spreadsData) return [];

        const now = new Date();
        const invalidGames = [];

        document.querySelectorAll('select').forEach(dropdown => {
            if (this.isLockDropdown(dropdown)) return;

            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (!selectedOption?.value) return;

            const teamName = this.cleanTeamName(selectedOption.text);
            const gameData = spreadsData.find(game => 
                game.team1.includes(teamName) || 
                game.team2.includes(teamName)
            );

            if (gameData && new Date(gameData.time) < now) {
                invalidGames.push({
                    team1: gameData.team1,
                    team2: gameData.team2,
                    time: gameData.time
                });
            }
        });

        return invalidGames;
    },

    showGameTimeWarning(invalidGames, form) {
        const content = document.createElement('div');
        content.innerHTML = `
            <h3>Warning: Games Already Started</h3>
            <p>The following games have already begun:</p>
            <ul>
                ${invalidGames.map(game => `
                    <li>${game.team1} vs ${game.team2} - 
                    Started: ${new Date(game.time).toLocaleString()}</li>
                `).join('')}
            </ul>
            <p>Unless these games were cancelled, you cannot change picks for these games.</p>
        `;

        const buttons = document.createElement('div');
        buttons.style.marginTop = '15px';
        buttons.style.textAlign = 'right';

        const proceedBtn = uiUtils.createElement('button', {
            className: 'psm-button',
            text: 'Proceed Anyway',
            styles: { marginRight: '10px', background: '#dc3545' }
        });
        proceedBtn.onclick = () => {
            form.submit();
            modal.close();
        };

        const cancelBtn = uiUtils.createElement('button', {
            className: 'psm-button',
            text: 'Modify Picks',
            styles: { background: '#28a745' }
        });
        cancelBtn.onclick = () => modal.close();

        buttons.appendChild(proceedBtn);
        buttons.appendChild(cancelBtn);
        content.appendChild(buttons);

        const modal = uiUtils.createModal(content);
    },

    async storeCurrentPicks() {
        const picks = {
            timestamp: Date.now(),
            week: this.determineCurrentWeek(),
            selections: {}
        };

        document.querySelectorAll('select').forEach(dropdown => {
            if (this.isLockDropdown(dropdown)) return;

            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (selectedOption?.value) {
                picks.selections[dropdown.name] = {
                    team: this.cleanTeamName(selectedOption.text),
                    value: selectedOption.value,
                    isLocked: this.isTeamLocked(selectedOption.value)
                };
            }
        });

        await storageUtils.set('lastPicks', picks);
        await this.updatePicksHistory(picks);
    },

    async updatePicksHistory(picks) {
        const history = await storageUtils.get('picksHistory', {});
        if (!history[picks.week]) {
            history[picks.week] = [];
        }
        history[picks.week].push(picks);
        await storageUtils.set('picksHistory', history);
    },

    addPicksPanel() {
        const panel = uiUtils.createPanel({
            right: '20px',
            top: '20px'
        });

        panel.innerHTML = `
            <div class="psm-panel-header">
                <strong>Current Picks</strong>
            </div>
            <div class="psm-panel-content" id="current-picks-display">
                <div class="empty-state">Make selections to see them here</div>
            </div>
        `;

        document.body.appendChild(panel);
    },

    updatePicksDisplay() {
        const display = document.getElementById('current-picks-display');
        if (!display) return;

        const picks = {};
        let hasSelections = false;

        document.querySelectorAll('select').forEach(dropdown => {
            if (this.isLockDropdown(dropdown)) return;

            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (selectedOption?.value) {
                hasSelections = true;
                picks[dropdown.name] = {
                    team: this.cleanTeamName(selectedOption.text),
                    isLocked: this.isTeamLocked(selectedOption.value)
                };
            }
        });

        if (!hasSelections) {
            display.innerHTML = '<div class="empty-state">Make selections to see them here</div>';
            return;
        }

        display.innerHTML = Object.entries(picks).map(([game, pick]) => `
            <div class="pick-item ${pick.isLocked ? 'locked' : ''}">
                ${game}: ${pick.team} ${pick.isLocked ? '🔒' : ''}
            </div>
        `).join('');
    },

    isLockDropdown(dropdown) {
        return dropdown.name?.toLowerCase().includes('lock') ||
               dropdown.id?.toLowerCase().includes('lock');
    },

    isTeamLocked(value) {
        const lockDropdown = Array.from(document.querySelectorAll('select'))
            .find(d => this.isLockDropdown(d));
        return lockDropdown && lockDropdown.value === value;
    },

    cleanTeamName(text) {
        return text
            .replace(/\([^)]*\)/g, '') // Remove spreads in parentheses
            .replace(/[-+]?\d+\.?\d*/g, '') // Remove remaining numbers
            .trim();
    },

    determineCurrentWeek() {
        const weekMatch = document.body.textContent.match(/Week (\d+)/i);
        return weekMatch ? weekMatch[1] : 'unknown';
    }
};

window.picksModule = picksModule;
