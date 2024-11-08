const wikiTeamModule = {
    async initialize() {
        this.teamAliases = null;
        await this.fetchTeamNames();
        
        if (this.teamAliases) {
            if (window.location.pathname.includes('spreads')) {
                this.standardizeTeamNames();
            } else if (window.location.pathname.includes('fbpicks')) {
                this.standardizePicksDropdowns();
            }
        }
    },

    async fetchTeamNames() {
        try {
            const response = await this.makeWikiRequest();
            this.teamAliases = this.parseWikiResponse(response);
        } catch (error) {
            console.error('Error fetching team names:', error);
            uiUtils.showNotification('Error loading team names', 'error');
        }
    },

    makeWikiRequest() {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&page=List_of_current_National_Football_League_team_names&prop=text&origin=*',
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: (response) => {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: reject
            });
        });
    },

    parseWikiResponse(response) {
        const teams = new Map();
        
        // Parse HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.parse.text['*'], 'text/html');
        
        // Find team name tables
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
                            teamName.split(' ').pop() // Add last word (e.g., "Cowboys" from "Dallas Cowboys")
                        ];
                        
                        teams.set(teamName, {
                            official: teamName,
                            aliases: allNames.map(this.normalizeTeamName)
                        });
                    }
                }
            });
        });
        
        return teams;
    },

    normalizeTeamName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/^the/, '');
    },

    findTeamMatch(inputName) {
        if (!this.teamAliases) return inputName;

        const normalizedInput = this.normalizeTeamName(inputName);
        
        for (const [official, data] of this.teamAliases) {
            if (data.aliases.includes(normalizedInput)) {
                return official;
            }
        }
        
        return inputName;
    },

    standardizeTeamNames() {
        const teamCells = document.querySelectorAll('td:first-child');
        teamCells.forEach(cell => {
            const originalText = cell.textContent;
            const teamName = this.extractTeamName(originalText);
            const matchedName = this.findTeamMatch(teamName);
            
            if (matchedName !== teamName) {
                cell.textContent = originalText.replace(teamName, matchedName);
            }
        });
    },

    standardizePicksDropdowns() {
        const dropdowns = document.querySelectorAll('select');
        dropdowns.forEach(dropdown => {
            Array.from(dropdown.options).forEach(option => {
                if (!option.value) return;
                
                const originalText = option.text;
                const teamName = this.extractTeamName(originalText);
                const matchedName = this.findTeamMatch(teamName);
                
                if (matchedName !== teamName) {
                    option.text = originalText.replace(teamName, matchedName);
                }
            });
        });
    },

    extractTeamName(text) {
        return text
            .replace(/\([^)]*\)/g, '')
            .replace(/[-+]?\d+\.?\d*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
};

window.wikiTeamModule = wikiTeamModule;
