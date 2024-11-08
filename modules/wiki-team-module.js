// modules/wiki-team-module.js
const wikiTeamModule = {
    async initialize() {
        // Wait for uiUtils to be available and initialized
        if (!window.uiUtils?.initialized) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (window.uiUtils?.initialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                // Add timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    throw new Error('Timeout waiting for uiUtils initialization');
                }, 10000);
            });
        }

        this.teamAliases = null;
        this.config = {
            version: '1.0.0',
            wikiPage: 'List_of_current_National_Football_League_team_names',
            cacheKey: 'pses_team_aliases',
            cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
            updateCheckInterval: 12 * 60 * 60 * 1000 // 12 hours
        };

        try {
            await this.initializeTeamData();

            if (window.location.pathname.includes('spreads')) {
                await this.standardizeTeamNames();
            } else if (window.location.pathname.includes('fbpicks')) {
                await this.standardizePicksDropdowns();
            }
        } catch (error) {
            console.error('Wiki Team Module initialization error:', error);
            if (window.uiUtils?.showNotification) {
                window.uiUtils.showNotification('Error loading team data', 'error');
            }
        }
    },

    async initializeTeamData() {
        const cached = await this.getCache();
        if (cached) {
            this.teamAliases = cached;
            // Check for updates in background
            this.checkForUpdates();
        } else {
            await this.fetchAndCacheTeamNames();
        }
    },

    async getCache() {
        const cache = await storageUtils.get(this.config.cacheKey);
        if (!cache) return null;

        const { data, timestamp, version } = cache;
        const expired = Date.now() - timestamp > this.config.cacheExpiry;
        const outdated = version !== this.config.version;

        if (expired || outdated) {
            await storageUtils.set(this.config.cacheKey, null);
            return null;
        }

        return data;
    },

    async checkForUpdates() {
        try {
            const response = await this.makeWikiRequest();
            const newData = this.parseWikiResponse(response);
            const currentData = JSON.stringify(this.teamAliases);
            const newDataString = JSON.stringify(newData);

            if (currentData !== newDataString) {
                this.teamAliases = newData;
                await this.cacheTeamData(newData);
                window.uiUtils.showNotification('Team data updated', 'info');
            }
        } catch (error) {
            console.error('Update check failed:', error);
        }
    },

    async fetchAndCacheTeamNames() {
        const response = await this.makeWikiRequest();
        this.teamAliases = this.parseWikiResponse(response);
        await this.cacheTeamData(this.teamAliases);
    },

    async cacheTeamData(data) {
        await storageUtils.set(this.config.cacheKey, {
            data,
            timestamp: Date.now(),
            version: this.config.version
        });
    },

    makeWikiRequest() {
        return new Promise((resolve, reject) => {
            const url = 'https://en.wikipedia.org/w/api.php';
            const params = new URLSearchParams({
                action: 'parse',
                format: 'json',
                page: this.config.wikiPage,
                prop: 'text',
                origin: '*'
            });

            GM.xmlHttpRequest({
                method: 'GET',
                url: `${url}?${params.toString()}`,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Api-User-Agent': 'Pigskin-Enhancement-Suite/1.0.0'
                },
                onload: (response) => {
                    try {
                        if (response.status !== 200) {
                            reject(new Error(`Wikipedia API returned status ${response.status}`));
                            return;
                        }

                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            reject(new Error(data.error.info));
                            return;
                        }
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: (error) => {
                    console.error('Wiki request error:', error);
                    reject(error);
                },
                ontimeout: () => reject(new Error('Request timed out'))
            });
        });
    },

    parseWikiResponse(response) {
        const teams = new Map();

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.parse.text['*'], 'text/html');

            const tables = doc.querySelectorAll('table.wikitable');
            tables.forEach(table => {
                table.querySelectorAll('tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const teamName = cells[0]?.textContent?.trim();
                        const alternateNames = cells[1]?.textContent?.trim();

                        if (teamName && alternateNames) {
                            // Create array of all possible names
                            const allNames = [
                                teamName,
                                ...alternateNames.split(',').map(n => n.trim()),
                                teamName.split(' ').pop(), // Last word (e.g., "Cowboys" from "Dallas Cowboys")
                                ...this.generateVariants(teamName) // Generate common variants
                            ];

                            // Store unique names only
                            const uniqueNames = [...new Set(allNames)];

                            teams.set(teamName, {
                                official: teamName,
                                aliases: uniqueNames.map(this.normalizeTeamName),
                                lastUpdated: Date.now()
                            });
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error parsing team data:', error);
            throw new Error('Failed to parse team data from Wikipedia');
        }

        return teams;
    },

    generateVariants(teamName) {
        const variants = [];
        const parts = teamName.split(' ');

        // City/Location only
        if (parts.length > 1) {
            variants.push(parts.slice(0, -1).join(' '));
        }

        // Common abbreviations (add more as needed)
        const commonAbbreviations = {
            'New York': 'NY',
            'San Francisco': 'SF',
            'Los Angeles': 'LA',
            'New England': 'NE'
        };

        for (const [full, abbr] of Object.entries(commonAbbreviations)) {
            if (teamName.includes(full)) {
                variants.push(teamName.replace(full, abbr));
            }
        }

        return variants;
    },

    normalizeTeamName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
            .replace(/^the/, '') // Remove leading "the"
            .trim();
    },

    findTeamMatch(inputName) {
        if (!this.teamAliases) return inputName;

        const normalizedInput = this.normalizeTeamName(inputName);

        for (const [official, data] of this.teamAliases) {
            if (data.aliases.includes(normalizedInput)) {
                return official;
            }
        }

        // If no exact match, try partial matching
        for (const [official, data] of this.teamAliases) {
            if (data.aliases.some(alias => alias.includes(normalizedInput) ||
                normalizedInput.includes(alias))) {
                return official;
            }
        }

        return inputName;
    },

    async standardizeTeamNames() {
        if (!this.teamAliases) {
            await this.initializeTeamData();
        }

        const teamCells = document.querySelectorAll('td:first-child');
        let updated = 0;

        teamCells.forEach(cell => {
            const originalText = cell.textContent;
            const teamName = this.extractTeamName(originalText);
            const matchedName = this.findTeamMatch(teamName);

            if (matchedName !== teamName) {
                cell.textContent = originalText.replace(teamName, matchedName);
                cell.title = `Original: ${teamName}`;
                updated++;
            }
        });

        if (updated > 0) {
            window.uiUtils.showNotification(`Standardized ${updated} team names`, 'success');
        }
    },

    async standardizePicksDropdowns() {
        if (!this.teamAliases) {
            await this.initializeTeamData();
        }

        const dropdowns = document.querySelectorAll('select');
        let updated = 0;

        dropdowns.forEach(dropdown => {
            Array.from(dropdown.options).forEach(option => {
                if (!option.value) return;

                const originalText = option.text;
                const teamName = this.extractTeamName(originalText);
                const matchedName = this.findTeamMatch(teamName);

                if (matchedName !== teamName) {
                    option.text = originalText.replace(teamName, matchedName);
                    option.title = `Original: ${teamName}`;
                    updated++;
                }
            });
        });

        if (updated > 0) {
            window.uiUtils.showNotification(`Standardized ${updated} team names in dropdowns`, 'success');
        }
    },

    extractTeamName(text) {
        return text
            .replace(/\([^)]*\)/g, '') // Remove parentheses and contents
            .replace(/[-+]?\d+\.?\d*/g, '') // Remove numbers and decimals
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    },

    getOfficialName(teamName) {
        return this.findTeamMatch(teamName);
    },

    async diagnostics() {
        return {
            version: this.config.version,
            cacheStatus: await this.getCache() ? 'valid' : 'invalid',
            teamCount: this.teamAliases ? this.teamAliases.size : 0,
            lastUpdate: this.teamAliases ? new Date(this.teamAliases.values().next().value.lastUpdated).toLocaleString() : 'never'
        };
    }
};

window.wikiTeamModule = wikiTeamModule;

