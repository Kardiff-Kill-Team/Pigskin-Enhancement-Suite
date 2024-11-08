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

    // Debug check for modules
    console.log('Checking for required modules:', {
        uiUtils: !!window.uiUtils,
        storageUtils: !!window.storageUtils,
        spreadsModule: !!window.spreadsModule,
        picksModule: !!window.picksModule,
        timeModule: !!window.timeModule,
        wikiTeamModule: !!window.wikiTeamModule,
        lockModule: !!window.lockModule,
        picksHistoryModule: !!window.picksHistoryModule,
        userIdModule: !!window.userIdModule,
        standingsModule: !!window.standingsModule
    });
// Debug logging function
    const debugLog = (message, data = null) => {
        const styles = 'background: #0066cc; color: white; padding: 2px 5px; border-radius: 3px;';
        if (data) {
            console.log('%c[PigSkin Suite Debug]%c ' + message, styles, '', data);
        } else {
            console.log('%c[PigSkin Suite Debug]%c ' + message, styles, '');
        }
    };

    // Add immediate checks for utilities
    debugLog('Script Starting');
    debugLog('Initial Utils Check:', {
        uiUtils: !!window.uiUtils,
        storageUtils: !!window.storageUtils,
        pathValidator: !!window.pathValidator
    });

    // Wait for utilities to be available
    const waitForUtils = async () => {
        let attempts = 0;
        const maxAttempts = 50;
        while (attempts < maxAttempts) {
            debugLog(`Attempt ${attempts + 1} checking for utilities`);
            if (window.uiUtils && window.storageUtils && window.pathValidator) {
                debugLog('All utilities loaded successfully');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;

            // Log which utilities are missing
            const missing = {
                uiUtils: !window.uiUtils,
                storageUtils: !window.storageUtils,
                pathValidator: !window.pathValidator
            };
            debugLog('Missing utilities:', missing);
        }
        throw new Error('Utilities failed to load after ' + maxAttempts + ' attempts');
    };

    // Configuration
    const config = {
        debug: true, // Set to true to help with debugging
        version: '1.0.0',
        repository: {
            owner: 'Kardiff-Kill-Team',
            name: 'Pigskin-Enhancement-Suite',
            branch: 'main',
            baseUrl: 'https://github.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite',
            rawBaseUrl: 'https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main'
        },
        modules: {
            'spreads': {
                paths: ['/spreads/index.html'],
                moduleFile: 'spreads-module.js',
                enabled: true,
                version: '1.0.0'
            },
            'picks': {
                paths: ['/forms/fbpicks.html'],
                moduleFile: 'picks-module.js',
                enabled: true,
                version: '1.0.0'
            },
            'standings': {
                paths: ['/standings/index.html'],
                moduleFile: 'standings-module.js',
                enabled: true,
                version: '1.0.0'
            }
        }
    };

    // Module Manager
    // Module Manager with modified initialization
    class ModuleManager {
        constructor() {
            this.loadedModules = new Map();
        }

        async initializeUI() {
            // Create and append style element directly instead of using uiUtils.addStyles
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

            @media (max-width: 768px) {
                .psm-status {
                    bottom: 5px;
                    left: 5px;
                    font-size: 10px;
                }
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
                // Initialize UI first
                await this.initializeUI();

                // Initialize utilities if they exist
                if (window.storageUtils && typeof window.storageUtils.initialize === 'function') {
                    await window.storageUtils.initialize();
                }

                if (window.uiUtils && typeof window.uiUtils.initialize === 'function') {
                    await window.uiUtils.initialize();
                }

                const currentPath = window.location.pathname;

                // Initialize page-specific modules
                for (const [moduleName, moduleConfig] of Object.entries(config.modules)) {
                    if (moduleConfig.enabled && moduleConfig.paths.some(path => currentPath.includes(path))) {
                        await this.initializeModule(moduleName);
                    }
                }

                if (config.debug) {
                    console.log('Initialized modules:', Array.from(this.loadedModules.keys()));
                }

            } catch (error) {
                console.error('Module initialization error:', error);
                // Use a basic alert if uiUtils isn't available
                if (window.uiUtils && typeof window.uiUtils.showNotification === 'function') {
                    window.uiUtils.showNotification('Failed to initialize some modules', 'error');
                } else {
                    console.error('Failed to initialize some modules');
                }
            }
        }

        async initializeModule(moduleName) {
            try {
                const windowModuleName = moduleName.split('-')
                    .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
                    .join('') + 'Module';

                console.log(`Looking for module: ${windowModuleName}`);
                console.log('Available window modules:', Object.keys(window).filter(key => key.includes('Module')));

                const module = window[windowModuleName];
                if (!module) {
                    console.error(`Module ${windowModuleName} not found on window object`);
                    return;
                }

                if (typeof module.initialize !== 'function') {
                    console.error(`Module ${windowModuleName} found but initialize method missing`);
                    console.log('Module contents:', module);
                    return;
                }

                await module.initialize();
                this.loadedModules.set(moduleName, true);
                console.log(`Successfully initialized ${moduleName} module`);

            } catch (error) {
                console.error(`Failed to initialize ${moduleName}:`, error);
                if (window.uiUtils) {
                    window.uiUtils.showNotification(
                        `Failed to initialize ${moduleName}. Some features may be unavailable.`,
                        'error'
                    );
                }
            }
        }
    }

    // Error Handler
    window.addEventListener('error', (event) => {
        console.error('Script error:', event.error);
        if (window.uiUtils) {
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
        if (window.uiUtils) {
            window.uiUtils.showNotification(
                'Failed to initialize the enhancement suite.',
                'error'
            );
        }
    }
})();