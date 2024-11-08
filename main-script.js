// ==UserScript==
// @name         Pigskin Enhancement Suite
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Comprehensive enhancement suite for Pigskin Mania
// @author       Kardiff
// @match        http://pigskinmania.net/*
// @match        https://pigskinmania.net/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/utils/path-validator.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/utils/storage-utils.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/utils/ui-utils.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/spreads-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/picks-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/lock-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/wiki-team-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/time-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/picks-history-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/user-id-module.js
// @require      https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/modules/standings-module.js
// @downloadURL  https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/main-script.js
// @updateURL    https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/main-script.js
// ==/UserScript==

(async function() {
    'use strict';

    // Debug logging function
    const debugLog = (message, data = null) => {
        const styles = 'background: #0066cc; color: white; padding: 2px 5px; border-radius: 3px;';
        if (data) {
            console.log('%c[PigSkin Suite Debug]%c ' + message, styles, '', data);
        } else {
            console.log('%c[PigSkin Suite Debug]%c ' + message, styles, '');
        }
    };

    // ModuleManager class
    class ModuleManager {
        constructor() {
            this.loadedModules = new Map();
            this.initialized = false;
        }

        async waitForModules() {
            debugLog('Waiting for modules to load...');
            const maxAttempts = 10;
            let attempts = 0;

            while (attempts < maxAttempts) {
                if (window.uiUtils && window.storageUtils) {
                    debugLog('Core modules loaded');
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            throw new Error('Required modules failed to load');
        }

        async initializeCore() {
            debugLog('Initializing core utilities');
            if (!window.uiUtils || !window.storageUtils) {
                throw new Error('Core modules not available');
            }

            // Initialize storage first
            await window.storageUtils.initialize();
            debugLog('Storage utils initialized');

            // Then initialize UI
            await window.uiUtils.initialize();
            debugLog('UI utils initialized');

            this.initialized = true;
        }

        async initializeUI() {
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .psm-status {
                    position: fixed;
                    bottom: 10px;
                    left: 10px;
                    background: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    font-size: 12px;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .psm-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #28a745;
                }
                .psm-status-text {
                    color: #333;
                }
            `;
            document.head.appendChild(styleElement);

            const status = document.createElement('div');
            status.className = 'psm-status';
            status.innerHTML = `
                <span class="psm-status-dot"></span>
                <span class="psm-status-text">PigSkin Suite v1.0.0</span>
            `;
            document.body.appendChild(status);
        }

        async initialize() {
            try {
                debugLog('Starting initialization');

                // Wait for DOM to be ready
                if (document.readyState !== 'complete') {
                    await new Promise(resolve => window.addEventListener('load', resolve));
                }

                // Wait for required modules
                await this.waitForModules();

                // Initialize core modules
                await this.initializeCore();

                // Add status indicator
                await this.initializeUI();

                const currentPath = window.location.pathname;
                debugLog('Current path:', currentPath);

                // Initialize page-specific modules
                if (currentPath.includes('spreads')) {
                    await this.initializeSpreadsPage();
                } else if (currentPath.includes('fbpicks')) {
                    await this.initializePicksPage();
                } else if (currentPath.includes('standings')) {
                    await this.initializeStandingsPage();
                }

                debugLog('Initialization complete');
            } catch (error) {
                console.error('Initialization error:', error);
                if (window.uiUtils?.showNotification) {
                    window.uiUtils.showNotification(
                        'Failed to initialize some modules. Please refresh the page.',
                        'error'
                    );
                }
            }
        }

        async initializeSpreadsPage() {
            debugLog('Initializing spreads page modules');
            const modules = [
                window.timeModule,
                window.wikiTeamModule,
                window.spreadsModule
            ];

            for (const module of modules) {
                if (module?.initialize) {
                    try {
                        await module.initialize();
                        debugLog(`Initialized ${module.name || 'module'}`);
                    } catch (error) {
                        console.error(`Failed to initialize module:`, error);
                    }
                }
            }
        }

        async initializePicksPage() {
            debugLog('Initializing picks page modules');
            const modules = [
                window.picksModule,
                window.lockModule,
                window.timeModule,
                window.picksHistoryModule,
                window.userIdModule
            ];

            for (const module of modules) {
                if (module?.initialize) {
                    try {
                        await module.initialize();
                    } catch (error) {
                        console.error(`Failed to initialize module:`, error);
                    }
                }
            }
        }

        async initializeStandingsPage() {
            debugLog('Initializing standings page modules');
            if (window.standingsModule?.initialize) {
                await window.standingsModule.initialize();
            }
        }
    }

    // Error Handler
    window.addEventListener('error', (event) => {
        console.error('Script error:', event.error);
        if (window.uiUtils?.showNotification) {
            window.uiUtils.showNotification(
                'An error occurred. Please check the console for details.',
                'error'
            );
        }
    });

    // Initialize
    try {
        const manager = new ModuleManager();
        await manager.initialize();
    } catch (error) {
        console.error('Failed to initialize Pigskin Suite:', error);
    }
})();