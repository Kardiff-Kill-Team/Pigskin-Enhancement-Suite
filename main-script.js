// ==UserScript==
// @name         Pigskin Mania Enhancement Suite
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Comprehensive enhancement suite for Pigskin Mania
// @author       Your name
// @match        http://pigskinmania.net/*
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/utils/storageUtils.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/utils/uiUtils.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/spreadsModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/picksModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/lockModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/wikiTeamModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/timeModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/picksHistoryModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/userIdModule.js
// @require      https://raw.githubusercontent.com/[username]/pigskin-enhancements/main/modules/standingsModule.js
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(async function() {
    'use strict';

    // Configuration
    const config = {
        debug: false,
        version: '1.0.0',
        modules: {
            spreads: {
                paths: ['/spreads/index.html'],
                enabled: true
            },
            picks: {
                paths: ['/forms/fbpicks.html'],
                enabled: true
            },
            standings: {
                paths: ['/standings/index.html'],
                enabled: true
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
                }
            `);

            const status = document.createElement('div');
            status.className = 'psm-status';
            status.textContent = `PigSkin Suite v${config.version}`;
            document.body.appendChild(status);
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
        }

        async initializeModule(moduleName) {
            try {
                const module = window[moduleName + 'Module'];
                if (module) {
                    await module.initialize();
                    this.loadedModules.set(moduleName, true);
                    if (config.debug) {
                        console.log(`Initialized ${moduleName} module`);
                    }
                }
            } catch (error) {
                console.error(`Failed to initialize ${moduleName}:`, error);
            }
        }
    }

    // Initialize
    try {
        const manager = new ModuleManager();
        await manager.initialize();
    } catch (error) {
        console.error('Failed to initialize Pigskin Suite:', error);
    }
})();
