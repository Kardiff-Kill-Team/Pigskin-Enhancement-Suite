

    const lockModule = {
        async initialize() {
            if (!window.location.pathname.includes('fbpicks')) return;

            this.setupLockDropdown();
            this.addLockPanel();
        },

        setupLockDropdown() {
            const lockDropdown = this.getLockDropdown();
            if (!lockDropdown) return;

            // Style the lock dropdown
            lockDropdown.classList.add('psm-select');
            lockDropdown.style.border = '2px solid #28a745';

            // Add change listener to regular dropdowns
            const gameDropdowns = Array.from(document.querySelectorAll('select'))
                .filter(dropdown => !this.isLockDropdown(dropdown));

            gameDropdowns.forEach(dropdown => {
                dropdown.addEventListener('change', () => {
                    this.updateLockDropdown();
                });
            });

            // Add change listener to lock dropdown
            lockDropdown.addEventListener('change', () => {
                this.updateLockDisplay();
            });

            // Initial update
            this.updateLockDropdown();
        },

        getLockDropdown() {
            return Array.from(document.querySelectorAll('select'))
                .find(dropdown => this.isLockDropdown(dropdown));
        },

        isLockDropdown(dropdown) {
            return dropdown.name?.toLowerCase().includes('lock') ||
                dropdown.id?.toLowerCase().includes('lock');
        },

        updateLockDropdown() {
            const lockDropdown = this.getLockDropdown();
            if (!lockDropdown) return;

            const selectedTeams = this.getSelectedTeams();

            // Update all options in lock dropdown
            Array.from(lockDropdown.options).forEach(option => {
                const gameNumber = option.value;
                const selectedTeam = selectedTeams.get(gameNumber);

                if (!gameNumber) return; // Skip empty/default option

                if (selectedTeam) {
                    // Enable and update text for selected teams
                    option.disabled = false;
                    option.classList.remove('disabled-option');
                    option.textContent = `Game ${gameNumber}: ${selectedTeam}`;

                    // Add spread information if available
                    const spread = this.getSpreadForTeam(selectedTeam);
                    if (spread) {
                        option.textContent += ` (${spread})`;
                    }
                } else {
                    // Disable and gray out unselected teams
                    option.disabled = true;
                    option.classList.add('disabled-option');
                    option.textContent = `Game ${gameNumber}: (Make selection first)`;
                }
            });

            // If current selection is invalid, reset it
            if (lockDropdown.value && !selectedTeams.has(lockDropdown.value)) {
                lockDropdown.value = '';
            }

            this.updateLockDisplay();
        },

        getSelectedTeams() {
            const teams = new Map();

            // Get all dropdowns except the lock dropdown
            const gameDropdowns = Array.from(document.querySelectorAll('select'))
                .filter(dropdown => !this.isLockDropdown(dropdown));

            // Collect selected teams and their corresponding game numbers
            gameDropdowns.forEach(dropdown => {
                const selectedOption = dropdown.options[dropdown.selectedIndex];
                if (selectedOption && selectedOption.value) {
                    const gameNumber = this.extractGameNumber(dropdown);
                    const teamName = this.cleanTeamName(selectedOption.text);
                    if (gameNumber) {
                        teams.set(gameNumber, teamName);
                    }
                }
            });

            return teams;
        },

        extractGameNumber(dropdown) {
            const match = dropdown.name?.match(/\d+/) || dropdown.id?.match(/\d+/);
            return match ? match[0] : null;
        },

        cleanTeamName(teamText) {
            return teamText
                .replace(/\([^)]*\)/g, '')
                .replace(/-?\d+\.?\d*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        getSpreadForTeam(teamName) {
            const spreadsData = storageUtils.get('currentSpreads', []);
            for (const game of spreadsData) {
                if (game.team1.includes(teamName)) return game.spread1;
                if (game.team2.includes(teamName)) return game.spread2;
            }
            return null;
        },

        addLockPanel() {
            const panel = uiUtils.createPanel({
                left: '20px',
                bottom: '20px',
                width: '250px'
            });

            panel.innerHTML = `
            <div class="psm-panel-header">
                <strong>Lock Status</strong>
            </div>
            <div class="psm-panel-content" id="lock-status-display">
                <div class="empty-state">No lock selected</div>
            </div>
        `;

            document.body.appendChild(panel);
        },

        updateLockDisplay() {
            const display = document.getElementById('lock-status-display');
            if (!display) return;

            const lockDropdown = this.getLockDropdown();
            if (!lockDropdown || !lockDropdown.value) {
                display.innerHTML = '<div class="empty-state">No lock selected</div>';
                return;
            }

            const selectedOption = lockDropdown.options[lockDropdown.selectedIndex];
            const teamName = this.cleanTeamName(selectedOption.text);
            const spread = this.getSpreadForTeam(teamName);

            display.innerHTML = `
            <div class="lock-status">
                <div style="font-size: 24px; text-align: center; margin-bottom: 10px;">🔒</div>
                <div style="font-weight: bold; margin-bottom: 5px;">
                    Game ${lockDropdown.value}
                </div>
                <div>${teamName}</div>
                ${spread ? `<div class="spread-info">Spread: ${spread}</div>` : ''}
            </div>
        `;
        }
    };

    window.lockModule = lockModule;
