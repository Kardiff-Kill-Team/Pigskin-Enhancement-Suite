// modules/time/time-module.js
import { TimeZonePanel } from './components/time-zone-panel';
import { CountdownDisplay } from './components/countdown-display';
import { TimeConverter } from './utils/time-converter';
import { TimeFormatter } from './utils/time-formatter';
import { TIME_STYLES } from './styles/time-styles';

class TimeModule {
    constructor() {
        this.initialized = false;
        this.converter = new TimeConverter();
        this.formatter = new TimeFormatter();
        this.panel = null;
        this.countdowns = new Map();
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await this.waitForDependencies();
            await this.initializeStyles();
            await this.initializeComponents();
            this.initialized = true;
        } catch (error) {
            console.error('Time module initialization error:', error);
            window.uiUtils?.showNotification?.('Error initializing time module', 'error');
            throw error;
        }
    }

    async waitForDependencies() {
        if (!window.uiUtils?.initialized) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.uiUtils?.initialized) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (attempts >= 50) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for uiUtils'));
                    }
                }, 100);
            });
        }
    }

    async initializeStyles() {
        await window.uiUtils.addStyles(TIME_STYLES);
    }

    async initializeComponents() {
        const currentPage = window.location.pathname;

        if (currentPage.includes('spreads')) {
            this.panel = new TimeZonePanel();
            await this.panel.initialize();
        } else if (currentPage.includes('fbpicks')) {
            const spreadsData = await window.storageUtils.get('currentSpreads');
            if (spreadsData) {
                await this.initializeCountdowns(spreadsData);
            }
        }
    }

    async initializeCountdowns(spreadsData) {
        const games = this.extractGamesFromSpreads(spreadsData);
        for (const game of games) {
            const countdown = new CountdownDisplay(game);
            await countdown.initialize();
            this.countdowns.set(game.id, countdown);
        }
    }

    extractGamesFromSpreads(spreadsData) {
        return spreadsData.map((game, index) => ({
            id: `game-${index}`,
            time: game.time,
            team1: game.team1,
            team2: game.team2
        }));
    }

    cleanup() {
        this.panel?.cleanup();
        this.countdowns.forEach(countdown => countdown.cleanup());
        this.countdowns.clear();
        this.initialized = false;
    }
}

// Export as singleton
export const timeModule = new TimeModule();
window.timeModule = timeModule;