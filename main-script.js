// ==UserScript==
// @name         Pigskin Enhancement Suite
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Comprehensive enhancement suite for Pigskin Mania
// @author       Kardiff
// @match        http://pigskinmania.net/*
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
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// @downloadURL  https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/main-script.js
// @updateURL    https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/main-script.js
// ==/UserScript==

(async function() {
    'use strict';

    // Configuration
    const config = {
        debug: false,
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
        },
        storage: {
            prefix: 'pses_',
            version: '1.0.0'
        },
        ui: {
            theme: {
                primary: '#007bff',
                success: '#28a745',
                warning: '#ffc107',
                danger: '#dc3545',
                info: '#17a2b8'
            },
            notifications: {
                duration: 3000,
                position: 'top-right'
            }
        }
    };

    // Module Manager
    class ModuleManager {
        constructor() {
            this.loadedModules = new Map();
            this.initializeUI();
        }

        initializeUI() {
            uiUtils.addStyles(`
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
                    background: ${config.ui.theme.success};
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
            `);

            const status = document.createElement('div');
            status.className = 'psm-status';
            status.innerHTML = `
                <span class="psm-status-dot"></span>
                <span class="psm-status-text">PigSkin Suite v${config.version}</span>
            `;
            document.body.appendChild(status);

            // Add version check
            this.checkVersion();
        }

        async checkVersion() {
            try {
                const response = await fetch(`${config.repository.rawBaseUrl}/version.json`);
                const versionInfo = await response.json();

                if (versionInfo.version !== config.version) {
                    uiUtils.showNotification(
                        'A new version is available. Please update your script.',
                        'info',
                        10000
                    );
                }
            } catch (error) {
                console.error('Version check failed:', error);
            }
        }

        async initialize() {
            const currentPath = window.location.pathname;

            // Initialize global utilities
            await storageUtils.initialize();
            await uiUtils.initialize();

            // Initialize page-specific modules
            for (const [moduleName, moduleConfig] of Object.entries(config.modules)) {
                if (moduleConfig.enabled && moduleConfig.paths.some(path => currentPath.includes(path))) {
                    await this.initializeModule(moduleName);
                }
            }

            // Log initialization in debug mode
            if (config.debug) {
                console.log('Initialized modules:', Array.from(this.loadedModules.keys()));
            }
        }

        async initializeModule(moduleName) {
            try {
                // Update to handle kebab-case to camelCase conversion for window object
                const windowModuleName = moduleName.split('-')
                    .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
                    .join('') + 'Module';

                const module = window[windowModuleName];
                if (module) {
                    await module.initialize();
                    this.loadedModules.set(moduleName, true);
                    if (config.debug) {
                        console.log(`Initialized ${moduleName} module`);
                    }
                }
            } catch (error) {
                console.error(`Failed to initialize ${moduleName}:`, error);
                uiUtils.showNotification(
                    `Failed to initialize ${moduleName}. Some features may be unavailable.`,
                    'error'
                );
            }
        }

        getLoadedModules() {
            return Array.from(this.loadedModules.keys());
        }

        isModuleLoaded(moduleName) {
            return this.loadedModules.has(moduleName);
        }
    }

    // Error Handler
    window.addEventListener('error', (event) => {
        if (config.debug) {
            console.error('Script error:', event.error);
        }
        uiUtils.showNotification(
            'An error occurred. Please check the console for details.',
            'error'
        );
    });

    // Initialize
    try {
        const manager = new ModuleManager();
        await manager.initialize();
    } catch (error) {
        console.error('Failed to initialize Pigskin Suite:', error);
        uiUtils.showNotification(
            'Failed to initialize the enhancement suite.',
            'error'
        );
    }
})();