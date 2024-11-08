const spreadsModule = {
    async initialize() {
        if (window.location.pathname.includes('spreads')) {
            await this.setupSpreadsPage();
        } else if (window.location.pathname.includes('fbpicks')) {
            await this.applySpreadsToPicksPage();
        }
    },

    async setupSpreadsPage() {
        const spreadsData = await this.collectSpreadsData();
        await storageUtils.set('currentSpreads', spreadsData);
        this.addTimeZoneButtons();
        this.highlightUserPicks();
    },

    async collectSpreadsData() {
        const spreads = [];
        const rows = document.querySelectorAll('table tr');
        let currentGame = {};

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const teamText = cells[0]?.textContent?.trim();
                const spreadText = cells[1]?.textContent?.trim();
                const timeText = cells[2]?.textContent?.trim();

                if (teamText && spreadText) {
                    if (!currentGame.team1) {
                        currentGame = {
                            team1: teamText,
                            spread1: this.parseSpread(spreadText),
                            time: this.parseGameTime(timeText)
                        };
                    } else {
                        currentGame.team2 = teamText;
                        currentGame.spread2 = this.parseSpread(spreadText);
                        spreads.push({...currentGame});
                        currentGame = {};
                    }
                }
            }
        });

        return spreads;
    },

    parseSpread(text) {
        const match = text.match(/-?\d+\.?\d*/);
        return match ? parseFloat(match[0]) : 0;
    },

    parseGameTime(text) {
        // Convert time text to standardized format
        try {
            const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeMatch) {
                const [_, hours, minutes, period] = timeMatch;
                const date = new Date();
                let hour = parseInt(hours);
                
                if (period) {
                    if (period.toUpperCase() === 'PM' && hour < 12) hour += 12;
                    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
                }
                
                date.setHours(hour, parseInt(minutes), 0, 0);
                return date.toISOString();
            }
        } catch (error) {
            console.error('Time parsing error:', error);
        }
        return null;
    },

    addTimeZoneButtons() {
        const timeZones = [
            { label: 'ET', zone: 'America/New_York' },
            { label: 'CT', zone: 'America/Chicago' },
            { label: 'MT', zone: 'America/Denver' },
            { label: 'AZ', zone: 'America/Phoenix' },
            { label: 'PT', zone: 'America/Los_Angeles' }
        ];

        const buttonContainer = uiUtils.createElement('div', {
            className: 'psm-panel',
            styles: {
                top: '20px',
                right: '20px',
                display: 'flex',
                gap: '5px',
                padding: '10px'
            }
        });

        timeZones.forEach(({label, zone}) => {
            const button = uiUtils.createElement('button', {
                className: 'psm-button',
                text: label,
                attributes: {
                    'data-zone': zone
                }
            });

            button.addEventListener('click', () => this.convertTimesToZone(zone));
            buttonContainer.appendChild(button);
        });

        document.body.appendChild(buttonContainer);
    },

    convertTimesToZone(targetZone) {
        const timeCells = document.querySelectorAll('td:nth-child(3)');
        timeCells.forEach(cell => {
            const originalTime = cell.getAttribute('data-original-time') || cell.textContent;
            if (!cell.getAttribute('data-original-time')) {
                cell.setAttribute('data-original-time', originalTime);
            }

            try {
                const date = new Date(this.parseGameTime(originalTime));
                const converted = date.toLocaleTimeString('en-US', {
                    timeZone: targetZone,
                    hour: 'numeric',
                    minute: '2-digit'
                });
                cell.textContent = `${converted} ${targetZone.split('/')[1]}`;
            } catch (error) {
                console.error('Time conversion error:', error);
            }
        });
    },

    async highlightUserPicks() {
        const lastPicks = await storageUtils.get('lastPicks');
        if (!lastPicks) return;

        const teamCells = document.querySelectorAll('td:first-child');
        teamCells.forEach(cell => {
            const teamName = cell.textContent.trim();
            if (Object.values(lastPicks.selections).some(pick => 
                pick.team.includes(teamName)
            )) {
                cell.style.backgroundColor = '#e6ffe6';
                cell.style.borderLeft = '3px solid #00cc00';
            }
        });
    },

    async applySpreadsToPicksPage() {
        const spreadsData = await storageUtils.get('currentSpreads');
        if (!spreadsData) {
            uiUtils.showNotification('Please visit spreads page first to load current spreads', 'warning');
            return;
        }

        this.updatePicksDropdowns(spreadsData);
    },

    updatePicksDropdowns(spreadsData) {
        const dropdowns = document.querySelectorAll('select');
        dropdowns.forEach(dropdown => {
            if (dropdown.name?.toLowerCase().includes('lock')) return;

            Array.from(dropdown.options).forEach(option => {
                if (!option.value) return;

                const teamName = option.text.trim();
                const gameData = this.findTeamInSpreads(teamName, spreadsData);
                
                if (gameData) {
                    const spread = this.getTeamSpread(teamName, gameData);
                    const spreadDisplay = spread > 0 ? `+${spread}` : spread;
                    option.text = `${teamName} (${spreadDisplay})`;
                }
            });
        });
    },

    findTeamInSpreads(teamName, spreadsData) {
        return spreadsData.find(game => 
            game.team1.includes(teamName) || 
            game.team2.includes(teamName)
        );
    },

    getTeamSpread(teamName, gameData) {
        if (gameData.team1.includes(teamName)) return gameData.spread1;
        if (gameData.team2.includes(teamName)) return gameData.spread2;
        return 0;
    }
};

// At the end of spreads-module.js
window.spreadsModule = spreadsModule;  // Change this from window['spreads-module']
