const timeModule = {
    initialized: false,
    timeZones: [
        { label: 'ET', zone: 'America/New_York' },
        { label: 'CT', zone: 'America/Chicago' },
        { label: 'MT', zone: 'America/Denver' },
        { label: 'AZ', zone: 'America/Phoenix' },
        { label: 'PT', zone: 'America/Los_Angeles' },
        { label: 'Local', zone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    ],

    async initialize() {
        if (this.initialized) return;

        // Wait for uiUtils to be available and initialized
        if (!window.uiUtils?.initialized) {
            await new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (window.uiUtils?.initialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                // Add timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout waiting for uiUtils initialization'));
                }, 10000);
            });
        }

        // Wait for DOM content to be loaded
        if (document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve));
        }

        try {
            await this.addStyles();

            if (window.location.pathname.includes('spreads')) {
                console.log('TimeModule: Setting up spreads page time controls');
                await this.setupSpreadsPageTime();
            } else if (window.location.pathname.includes('fbpicks')) {
                console.log('TimeModule: Setting up picks page time');
                await this.setupPicksPageTime();
            }

            this.initialized = true;
        } catch (error) {
            console.error('Time module initialization error:', error);
            if (window.uiUtils?.showNotification) {
                window.uiUtils.showNotification('Error initializing time module', 'error');
            }
            throw error;
        }
    },

    async addStyles() {
        try {
            const styles = `
                .time-panel {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1001;
                    padding: 10px;
                    margin-bottom: 10px;
                }

                .time-zone-buttons {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                    margin-bottom: 10px;
                }

                .time-zone-btn {
                    padding: 5px 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    cursor: pointer;
                    background: #f8f9fa;
                    transition: all 0.2s;
                }

                .time-zone-btn.active {
                    background: #007bff;
                    color: white;
                    border-color: #0056b3;
                }

                .time-zone-btn:hover {
                    background: #e9ecef;
                }

                .time-zone-btn.active:hover {
                    background: #0056b3;
                }

                .game-time {
                    transition: background-color 0.3s;
                }

                .game-time.updated {
                    background-color: #fff3cd;
                }

                .game-time-warning {
                    color: #dc3545;
                    font-weight: bold;
                }

                .countdown-timer {
                    font-size: 0.9em;
                    color: #6c757d;
                    margin-top: 5px;
                }
            `;
            await window.uiUtils.addStyles(styles);
        } catch (error) {
            console.error('Error adding styles:', error);
            throw error;
        }
    },

    setupSpreadsPageTime() {
        console.log('Creating time zone panel');
        // Create time zone panel
        const panel = window.uiUtils.createElement('div', {
            className: 'psm-panel',
            styles: {
                top: '20px',
                right: '20px',
                zIndex: '1000',
                background: '#ffffff',
                padding: '10px',
                border: '1px solid #ccc'
            }
        });

        panel.innerHTML = `
            <div class="psm-panel-header">
                <strong>Time Zones</strong>
            </div>
            <div class="psm-panel-content">
                <div class="time-zone-buttons"></div>
                <div id="current-time-display"></div>
            </div>
        `;

        // Add time zone buttons
        const buttonContainer = panel.querySelector('.time-zone-buttons');
        this.timeZones.forEach(({label, zone}) => {
            const button = window.uiUtils.createElement('button', {
                className: 'time-zone-btn',
                text: label,
                attributes: {
                    'data-zone': zone
                }
            });

            button.addEventListener('click', (e) => {
                console.log(`Time zone button clicked: ${label}`);
                this.updateActiveTimeZone(e.target);
                this.convertPageTimes(zone);
            });

            buttonContainer.appendChild(button);
        });

        console.log('Appending time zone panel to document');
        document.body.appendChild(panel);
        console.log('Time zone panel added');

        // Start current time display
        this.updateCurrentTimeDisplay();
        setInterval(() => this.updateCurrentTimeDisplay(), 1000);

        // Store original times
        this.storeOriginalTimes();
    },

    async setupPicksPageTime() {
        const spreadsData = await window.storageUtils.get('currentSpreads');
        if (!spreadsData) return;

        this.addGameTimeIndicators(spreadsData);
        this.startGameCountdowns();
    },

    storeOriginalTimes() {
        const timeCells = document.querySelectorAll('td:nth-child(3)');
        timeCells.forEach(cell => {
            const originalTime = cell.textContent.trim();
            cell.setAttribute('data-original-time', originalTime);
            cell.classList.add('game-time');
        });
    },

    updateActiveTimeZone(clickedButton) {
        document.querySelectorAll('.time-zone-btn').forEach(btn =>
            btn.classList.remove('active')
        );
        clickedButton.classList.add('active');
    },

    convertPageTimes(targetZone) {
        const timeCells = document.querySelectorAll('.game-time');
        timeCells.forEach(cell => {
            const originalTime = cell.getAttribute('data-original-time');
            if (!originalTime) return;

            try {
                const date = this.parseGameTime(originalTime);
                if (!date) return;

                const converted = date.toLocaleTimeString('en-US', {
                    timeZone: targetZone,
                    hour: 'numeric',
                    minute: '2-digit'
                });

                cell.textContent = `${converted} ${this.getTimeZoneAbbr(targetZone)}`;

                // Flash effect for updated time
                cell.classList.add('updated');
                setTimeout(() => cell.classList.remove('updated'), 1000);
            } catch (error) {
                console.error('Time conversion error:', error);
            }
        });
    },

    parseGameTime(timeString) {
        const today = new Date();
        const [time, period] = timeString.split(/\s+/);
        const [hours, minutes] = time.split(':').map(Number);

        let hour = hours;
        if (period) {
            if (period.toUpperCase() === 'PM' && hours < 12) hour += 12;
            if (period.toUpperCase() === 'AM' && hours === 12) hour = 0;
        }

        today.setHours(hour, minutes || 0, 0, 0);
        return today;
    },

    getTimeZoneAbbr(zone) {
        const tz = this.timeZones.find(t => t.zone === zone);
        return tz ? tz.label : zone.split('/').pop();
    },

    updateCurrentTimeDisplay() {
        const display = document.getElementById('current-time-display');
        if (!display) return;

        const activeZone = document.querySelector('.time-zone-btn.active')?.dataset.zone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone;

        const now = new Date().toLocaleTimeString('en-US', {
            timeZone: activeZone,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });

        display.textContent = `Current Time: ${now} ${this.getTimeZoneAbbr(activeZone)}`;
    },

    addGameTimeIndicators(spreadsData) {
        const dropdowns = document.querySelectorAll('select');
        dropdowns.forEach(dropdown => {
            if (this.isLockDropdown(dropdown)) return;

            const gameNumber = this.extractGameNumber(dropdown);
            if (!gameNumber) return;

            const gameData = spreadsData.find(game =>
                game.team1.includes(this.getSelectedTeam(dropdown)) ||
                game.team2.includes(this.getSelectedTeam(dropdown))
            );

            if (gameData) {
                this.addTimeIndicator(dropdown, gameData);
            }
        });
    },

    addTimeIndicator(dropdown, gameData) {
        const container = document.createElement('div');
        container.className = 'countdown-timer';
        dropdown.parentNode.appendChild(container);

        this.updateTimeIndicator(container, gameData.time);
        setInterval(() => this.updateTimeIndicator(container, gameData.time), 1000);
    },

    updateTimeIndicator(container, gameTime) {
        const now = new Date();
        const gameDate = new Date(gameTime);
        const timeDiff = gameDate - now;

        if (timeDiff < 0) {
            container.innerHTML = `
                <div class="game-time-warning">
                    Game has started
                </div>
            `;
            return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        container.textContent = `Time until game: ${hours}h ${minutes}m ${seconds}s`;
    },

    startGameCountdowns() {
        const countdowns = document.querySelectorAll('.countdown-timer');
        countdowns.forEach(countdown => {
            const updateInterval = setInterval(() => {
                if (countdown.querySelector('.game-time-warning')) {
                    clearInterval(updateInterval);
                }
            }, 1000);
        });
    },

    isLockDropdown(dropdown) {
        return dropdown.name?.toLowerCase().includes('lock') ||
            dropdown.id?.toLowerCase().includes('lock');
    },

    extractGameNumber(dropdown) {
        const match = dropdown.name?.match(/\d+/) || dropdown.id?.match(/\d+/);
        return match ? match[0] : null;
    },

    getSelectedTeam(dropdown) {
        const option = dropdown.options[dropdown.selectedIndex];
        return option ? option.text.trim().replace(/\([^)]*\)/g, '').trim() : '';
    }
};

// Make the module available globally
window.timeModule = timeModule;