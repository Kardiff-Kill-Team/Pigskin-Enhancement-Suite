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

    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
        await new Promise(resolve => window.addEventListener('load', resolve));
    }

    // Debug logging function
    const debugLog = (message, data = null) => {
        const styles = 'background: #0066cc; color: white; padding: 2px 5px; border-radius: 3px;';
        if (data) {
            console.log('%c[PigSkin Suite Debug]%c ' + message, styles, '', data);
        } else {
            console.log('%c[PigSkin Suite Debug]%c ' + message, styles, '');
        }
    };

    // Module status logging function
    const logModuleStatus = () => {
        const modules = {
            uiUtils: window.uiUtils,
            storageUtils: window.storageUtils,
            spreadsModule: window.spreadsModule,
            picksModule: window.picksModule,
            timeModule: window.timeModule,
            wikiTeamModule: window.wikiTeamModule,
            lockModule: window.lockModule,
            picksHistoryModule: window.picksHistoryModule,
            userIdModule: window.userIdModule,
            standingsModule: window.standingsModule
        };

        debugLog('Module Status:', Object.fromEntries(
            Object.entries(modules).map(([name, module]) => [
                name,
                {
                    exists: !!module,
                    hasInitialize: module && typeof module.initialize === 'function'
                }
            ])
        ));
    };

    // Configuration
    const config = {
        debug: true,
        version: '1.0.0',
        modules: {
            spreads: { paths: ['/spreads'], enabled: true },
            picks: { paths: ['/fbpicks'], enabled: true },
            standings: { paths: ['/standings'], enabled: true }
        }
    };

    // ModuleManager class
    class ModuleManager {
        constructor() {
            this.loadedModules = new Map();
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
                <span class="psm-status-text">PigSkin Suite v${config.version}</span>
            `;
            document.body.appendChild(status);
        }

        async initialize() {
            try {
                debugLog('Starting initialization');
                await this.initializeUI();

                // Initialize utilities
                if (window.storageUtils?.initialize) {
                    debugLog('Initializing storageUtils');
                    await window.storageUtils.initialize();
                }
                if (window.uiUtils?.initialize) {
                    debugLog('Initializing uiUtils');
                    await window.uiUtils.initialize();
                }

                // Log initial module status
                debugLog('Initial module check');
                logModuleStatus();

                // Wait for modules to be available
                debugLog('Waiting for modules to load');
                await new Promise(resolve => setTimeout(resolve, 500));

                // Log status after delay
                debugLog('Module check after delay');
                logModuleStatus();

                const currentPath = window.location.pathname;
                debugLog('Current path:', currentPath);

                // Initialize appropriate modules based on page
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
                    window.uiUtils.showNotification('Failed to initialize some modules', 'error');
                }
            }
        }

        async initializeSpreadsPage() {
            debugLog('Initializing spreads page modules');
            if (window.timeModule?.initialize) await window.timeModule.initialize();
            if (window.wikiTeamModule?.initialize) await window.wikiTeamModule.initialize();
            if (window.spreadsModule?.initialize) {
                debugLog('Starting spreadsModule initialization');
                await window.spreadsModule.initialize();
                debugLog('Completed spreadsModule initialization');
            } else {
                console.error('SpreadsModule not found or missing initialize method');
            }
        }

        async initializePicksPage() {
            debugLog('Initializing picks page modules');
            if (window.picksModule?.initialize) await window.picksModule.initialize();
            if (window.lockModule?.initialize) await window.lockModule.initialize();
            if (window.timeModule?.initialize) await window.timeModule.initialize();
            if (window.picksHistoryModule?.initialize) await window.picksHistoryModule.initialize();
            if (window.userIdModule?.initialize) await window.userIdModule.initialize();
        }

        async initializeStandingsPage() {
            debugLog('Initializing standings page modules');
            if (window.standingsModule?.initialize) await window.standingsModule.initialize();
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
        debugLog('Creating ModuleManager');
        const manager = new ModuleManager();
        debugLog('Starting manager initialization');
        await manager.initialize();
    } catch (error) {
        console.error('Failed to initialize Pigskin Suite:', error);
        if (window.uiUtils?.showNotification) {
            window.uiUtils.showNotification(
                'Failed to initialize the enhancement suite.',
                'error'
            );
        }
    }
})();