// modules/picksHistoryModule.js
const picksHistoryModule = {
    async initialize() {
        this.addStyles();
        await this.createHistoryPanel();

        if (window.location.pathname.includes('fbpicks')) {
            await this.setupFormHandling();
        }
    },

    addStyles() {
        uiUtils.addStyles(`
            .picks-history-panel {
                max-width: 400px;
                max-height: 80vh;
                overflow: hidden;
            }

            .picks-history-content {
                overflow-y: auto;
                max-height: calc(80vh - 50px);
            }

            .week-selector {
                width: 100%;
                margin-bottom: 10px;
            }

            .pick-item {
                background: white;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 8px;
                border-left: 3px solid transparent;
            }

            .pick-item.locked {
                border-left-color: #28a745;
            }

            .pick-item.winner {
                background-color: #d4edda;
            }

            .pick-item.loser {
                background-color: #f8d7da;
            }

            .pick-details {
                font-size: 0.9em;
                color: #6c757d;
                margin-top: 5px;
            }

            .picks-controls {
                display: flex;
                gap: 10px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #dee2e6;
            }

            .picks-history-stats {
                background: #f8f9fa;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            .export-options {
                display: none;
                margin-top: 10px;
            }

            .export-options.visible {
                display: block;
            }

            .export-option-btn {
                margin: 5px;
                padding: 5px 10px;
            }

            .history-empty-state {
                text-align: center;
                padding: 20px;
                color: #6c757d;
            }
        `);
    },

    async createHistoryPanel() {
        const panel = uiUtils.createPanel({
            right: '20px',
            top: '20px',
            width: '400px'
        });

        panel.className = 'picks-history-panel psm-panel';
        panel.innerHTML = `
            <div class="psm-panel-header">
                <strong>Picks History</strong>
                <button class="psm-button collapse-btn" style="padding: 2px 6px;">_</button>
            </div>
            <div class="psm-panel-content">
                <div class="picks-history-stats"></div>
                <select class="psm-select week-selector">
                    <option value="">Select Week</option>
                </select>
                <div class="picks-history-content"></div>
                <div class="picks-controls">
                    <button class="psm-button export-btn">Export</button>
                    <button class="psm-button clear-btn" style="background: #dc3545;">Clear History</button>
                </div>
                <div class="export-options">
                    <button class="psm-button export-option-btn" data-format="json">JSON</button>
                    <button class="psm-button export-option-btn" data-format="csv">CSV</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        this.setupPanelListeners(panel);
        await this.updateWeeksList();
        await this.updateStats();
    },

    async setupPanelListeners(panel) {
        const collapseBtn = panel.querySelector('.collapse-btn');
        const content = panel.querySelector('.psm-panel-content');
        collapseBtn.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            collapseBtn.textContent = content.style.display === 'none' ? '□' : '_';
        });

        const weekSelector = panel.querySelector('.week-selector');
        weekSelector.addEventListener('change', () => {
            this.displayPicksForWeek(weekSelector.value);
        });

        const exportBtn = panel.querySelector('.export-btn');
        const exportOptions = panel.querySelector('.export-options');
        exportBtn.addEventListener('click', () => {
            exportOptions.classList.toggle('visible');
        });

        panel.querySelectorAll('.export-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportPicks(btn.dataset.format);
                exportOptions.classList.remove('visible');
            });
        });

        const clearBtn = panel.querySelector('.clear-btn');
        clearBtn.addEventListener('click', () => this.handleClearHistory());
    },

    async updateWeeksList() {
        const allPicks = await storageUtils.get('picksHistory', {});
        const weekSelector = document.querySelector('.week-selector');
        if (!weekSelector) return;

        while (weekSelector.options.length > 1) {
            weekSelector.remove(1);
        }

        Object.keys(allPicks)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .forEach(week => {
                const option = document.createElement('option');
                option.value = week;
                option.textContent = `Week ${week}`;
                weekSelector.appendChild(option);
            });
    },

    async updateStats() {
        const stats = await this.calculateStats();
        const statsDiv = document.querySelector('.picks-history-stats');
        if (!statsDiv) return;

        statsDiv.innerHTML = `
            <div class="stat-item">
                <span>Total Picks:</span>
                <strong>${stats.totalPicks}</strong>
            </div>
            <div class="stat-item">
                <span>Weeks Played:</span>
                <strong>${stats.weeksPlayed}</strong>
            </div>
            <div class="stat-item">
                <span>Lock Success Rate:</span>
                <strong>${stats.lockSuccessRate}%</strong>
            </div>
        `;
    },

    async calculateStats() {
        const allPicks = await storageUtils.get('picksHistory', {});
        const stats = {
            totalPicks: 0,
            weeksPlayed: Object.keys(allPicks).length,
            locksWon: 0,
            totalLocks: 0
        };

        Object.values(allPicks).forEach(weekPicks => {
            weekPicks.forEach(pick => {
                stats.totalPicks += Object.keys(pick.selections).length;
                const lockedPick = Object.values(pick.selections).find(s => s.isLocked);
                if (lockedPick) {
                    stats.totalLocks++;
                    if (lockedPick.won) stats.locksWon++;
                }
            });
        });

        stats.lockSuccessRate = stats.totalLocks ?
            ((stats.locksWon / stats.totalLocks) * 100).toFixed(1) : 0;

        return stats;
    },

    async displayPicksForWeek(week) {
        const content = document.querySelector('.picks-history-content');
        if (!content || !week) return;

        const allPicks = await storageUtils.get('picksHistory', {});
        const weekPicks = allPicks[week] || [];

        if (weekPicks.length === 0) {
            content.innerHTML = `<div class="history-empty-state">No picks found for Week ${week}</div>`;
            return;
        }

        content.innerHTML = weekPicks
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(picks => this.renderPickSet(picks, week))
            .join('');
    },

    renderPickSet(picks, week) {
        const timestamp = new Date(picks.timestamp).toLocaleString();
        const picksHtml = Object.entries(picks.selections)
            .map(([game, selection]) => `
                <div class="pick-item ${selection.isLocked ? 'locked' : ''} ${selection.won ? 'winner' : selection.won === false ? 'loser' : ''}">
                    <div>Game ${game}: ${selection.team}</div>
                    ${selection.isLocked ? '<span>🔒 Lock</span>' : ''}
                    ${selection.spread ? `<div>Spread: ${selection.spread}</div>` : ''}
                </div>
            `).join('');

        return `
            <div class="pick-set">
                <div class="pick-details">Submitted: ${timestamp}</div>
                ${picksHtml}
            </div>
        `;
    },

    async setupFormHandling() {
        const form = document.querySelector('form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            const picks = this.gatherCurrentPicks();
            await this.storePicks(picks);
        });
    },

    gatherCurrentPicks() {
        const picks = {
            timestamp: Date.now(),
            week: this.determineCurrentWeek(),
            selections: {},
            source: 'Pigskin-Enhancement-Suite',
            version: '1.0.0'
        };

        document.querySelectorAll('select').forEach(dropdown => {
            if (this.isLockDropdown(dropdown)) return;

            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (selectedOption?.value) {
                picks.selections[dropdown.name] = {
                    team: this.cleanTeamName(selectedOption.text),
                    value: selectedOption.value,
                    isLocked: this.isTeamLocked(selectedOption.value),
                    spread: this.getSpread(selectedOption.text)
                };
            }
        });

        return picks;
    },

    async storePicks(picks) {
        const history = await storageUtils.get('picksHistory', {});
        if (!history[picks.week]) {
            history[picks.week] = [];
        }
        history[picks.week].push(picks);
        await storageUtils.set('picksHistory', history);
        await this.updateWeeksList();
        await this.updateStats();
    },

    async exportPicks(format) {
        const allPicks = await storageUtils.get('picksHistory', {});
        let exportData;
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `pigskin_picks_history_${timestamp}`;

        if (format === 'json') {
            exportData = JSON.stringify(allPicks, null, 2);
            this.downloadFile(exportData, `${filename}.json`, 'application/json');
        } else if (format === 'csv') {
            exportData = this.convertToCSV(allPicks);
            this.downloadFile(exportData, `${filename}.csv`, 'text/csv');
        }
    },

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },

    convertToCSV(picksHistory) {
        const headers = [
            'Week',
            'Timestamp',
            'Game',
            'Team',
            'Locked',
            'Spread',
            'Result',
            'Source',
            'Version'
        ];

        const rows = [headers];

        Object.entries(picksHistory).forEach(([week, weekPicks]) => {
            weekPicks.forEach(pick => {
                Object.entries(pick.selections).forEach(([game, selection]) => {
                    rows.push([
                        week,
                        new Date(pick.timestamp).toISOString(),
                        game,
                        selection.team,
                        selection.isLocked ? 'Yes' : 'No',
                        selection.spread || '',
                        selection.won === true ? 'Won' :
                            selection.won === false ? 'Lost' : 'Unknown',
                        pick.source || 'Pigskin-Enhancement-Suite',
                        pick.version || '1.0.0'
                    ]);
                });
            });
        });

        return rows.map(row =>
            row.map(cell =>
                `"${String(cell).replace(/"/g, '""')}"`
            ).join(',')
        ).join('\n');
    },

    async handleClearHistory() {
        if (!confirm('Are you sure you want to clear all picks history? This cannot be undone.')) {
            return;
        }

        await storageUtils.set('picksHistory', {});
        await this.updateWeeksList();
        await this.updateStats();

        const content = document.querySelector('.picks-history-content');
        if (content) {
            content.innerHTML = '<div class="history-empty-state">No picks history</div>';
        }

        uiUtils.showNotification('Picks history cleared', 'success');
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
            .replace(/\([^)]*\)/g, '')
            .replace(/[-+]?\d+\.?\d*/g, '')
            .trim();
    },

    getSpread(text) {
        const match = text.match(/[-+]?\d+\.?\d*/);
        return match ? match[0] : null;
    },

    determineCurrentWeek() {
        const weekMatch = document.body.textContent.match(/Week (\d+)/i);
        return weekMatch ? weekMatch[1] : 'unknown';
    }
};

window.picksHistoryModule = picksHistoryModule;