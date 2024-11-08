const standingsModule = {
    async initialize() {
        if (!window.location.pathname.includes('standings')) return;
        
        this.addStyles();
        await this.setupBookmarks();
        this.addBookmarkControls();
    },

    addStyles() {
        uiUtils.addStyles(`
            .standings-controls {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                min-width: 250px;
                max-width: 300px;
            }

            .bookmarked-player {
                background-color: #fff3cd !important;
                transition: background-color 0.3s;
            }

            .bookmark-btn {
                padding: 2px 6px;
                margin-left: 5px;
                font-size: 0.8em;
                cursor: pointer;
                border: none;
                border-radius: 3px;
                background: #f8f9fa;
            }

            .bookmark-btn.active {
                background: #ffc107;
                color: #000;
            }

            .bookmark-list {
                margin-top: 10px;
                max-height: 300px;
                overflow-y: auto;
            }

            .bookmark-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin: 5px 0;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 0.9em;
            }

            .bookmark-item:hover {
                background: #e9ecef;
            }

            .bookmark-item-controls {
                display: flex;
                gap: 5px;
            }

            .jump-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 3px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8em;
            }

            .remove-bookmark {
                background: #dc3545;
                color: white;
                border: none;
                padding: 3px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8em;
            }

            .flash-highlight {
                animation: flashHighlight 1s;
            }

            @keyframes flashHighlight {
                0% { background-color: #ffc107; }
                100% { background-color: #fff3cd; }
            }

            .search-box {
                width: 100%;
                padding: 5px;
                margin-bottom: 10px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
            }
        `);
    },

    async setupBookmarks() {
        // Add bookmark buttons to each player
        const playerRows = document.querySelectorAll('tr');
        playerRows.forEach(row => {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell && nameCell.textContent.trim()) {
                const bookmarkBtn = document.createElement('button');
                bookmarkBtn.className = 'bookmark-btn';
                bookmarkBtn.innerHTML = '★';
                bookmarkBtn.title = 'Bookmark this player';
                
                bookmarkBtn.addEventListener('click', () => this.toggleBookmark(row));
                
                nameCell.appendChild(bookmarkBtn);
            }
        });

        // Highlight existing bookmarks
        await this.highlightBookmarkedPlayers();
    },

    async toggleBookmark(row) {
        const playerName = row.querySelector('td:first-child').textContent.trim().replace('★', '');
        const bookmarks = await storageUtils.get('playerBookmarks', []);
        
        const index = bookmarks.indexOf(playerName);
        if (index === -1) {
            bookmarks.push(playerName);
            uiUtils.showNotification(`Bookmarked: ${playerName}`, 'success');
        } else {
            bookmarks.splice(index, 1);
            uiUtils.showNotification(`Removed bookmark: ${playerName}`, 'info');
        }
        
        await storageUtils.set('playerBookmarks', bookmarks);
        await this.updateBookmarkList();
        await this.highlightBookmarkedPlayers();
    },

    addBookmarkControls() {
        const controls = document.createElement('div');
        controls.className = 'standings-controls';
        
        controls.innerHTML = `
            <div class="psm-panel-header">
                <strong>Bookmarked Players</strong>
                <button class="psm-button collapse-btn">_</button>
            </div>
            <div class="controls-content">
                <input type="text" class="search-box" placeholder="Search players...">
                <div class="bookmark-list"></div>
            </div>
        `;

        document.body.appendChild(controls);

        // Setup event listeners
        const searchBox = controls.querySelector('.search-box');
        searchBox.addEventListener('input', (e) => this.filterPlayers(e.target.value));

        const collapseBtn = controls.querySelector('.collapse-btn');
        const content = controls.querySelector('.controls-content');
        collapseBtn.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            collapseBtn.textContent = content.style.display === 'none' ? '□' : '_';
        });

        // Initial bookmark list
        this.updateBookmarkList();
    },

    async updateBookmarkList() {
        const bookmarkList = document.querySelector('.bookmark-list');
        const bookmarks = await storageUtils.get('playerBookmarks', []);

        if (bookmarks.length === 0) {
            bookmarkList.innerHTML = '<div class="bookmark-item">No bookmarked players</div>';
            return;
        }

        bookmarkList.innerHTML = bookmarks.map(player => `
            <div class="bookmark-item">
                <span>${player}</span>
                <div class="bookmark-item-controls">
                    <button class="jump-btn" data-player="${player}">Jump</button>
                    <button class="remove-bookmark" data-player="${player}">✕</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to buttons
        bookmarkList.querySelectorAll('.jump-btn').forEach(btn => {
            btn.addEventListener('click', () => this.jumpToPlayer(btn.dataset.player));
        });

        bookmarkList.querySelectorAll('.remove-bookmark').forEach(btn => {
            btn.addEventListener('click', async () => {
                const player = btn.dataset.player;
                const bookmarks = await storageUtils.get('playerBookmarks', []);
                const updatedBookmarks = bookmarks.filter(p => p !== player);
                await storageUtils.set('playerBookmarks', updatedBookmarks);
                await this.updateBookmarkList();
                await this.highlightBookmarkedPlayers();
                uiUtils.showNotification(`Removed bookmark: ${player}`, 'info');
            });
        });
    },

    async highlightBookmarkedPlayers() {
        const bookmarks = await storageUtils.get('playerBookmarks', []);
        
        // Remove existing highlights
        document.querySelectorAll('.bookmarked-player').forEach(el => {
            el.classList.remove('bookmarked-player');
        });

        // Add new highlights
        document.querySelectorAll('tr').forEach(row => {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell) {
                const playerName = nameCell.textContent.trim().replace('★', '');
                if (bookmarks.includes(playerName)) {
                    row.classList.add('bookmarked-player');
                    const bookmarkBtn = nameCell.querySelector('.bookmark-btn');
                    if (bookmarkBtn) {
                        bookmarkBtn.classList.add('active');
                    }
                }
            }
        });
    },

    jumpToPlayer(playerName) {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell && nameCell.textContent.trim().replace('★', '').includes(playerName)) {
                // Smooth scroll to player
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Flash effect
                row.classList.remove('flash-highlight');
                void row.offsetWidth; // Trigger reflow
                row.classList.add('flash-highlight');
                break;
            }
        }
    },

    filterPlayers(searchTerm) {
        if (!searchTerm) {
            this.highlightBookmarkedPlayers();
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        document.querySelectorAll('tr').forEach(row => {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell) {
                const playerName = nameCell.textContent.trim().replace('★', '');
                if (playerName.toLowerCase().includes(searchLower)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }
};

window.standingsModule = standingsModule;
