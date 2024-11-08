// modules/time/components/countdown-display.js
import { TimeFormatter } from '../utils/time-formatter';

export class CountdownDisplay {
    constructor(gameData) {
        this.gameData = gameData;
        this.container = null;
        this.updateInterval = null;
        this.formatter = new TimeFormatter();
    }

    async initialize() {
        this.container = this.createContainer();
        this.startCountdown();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'countdown-timer';
        this.appendToGameElement(container);
        return container;
    }

    appendToGameElement(container) {
        const gameElement = this.findGameElement();
        if (gameElement) {
            gameElement.appendChild(container);
        }
    }

    startCountdown() {
        this.updateDisplay();
        this.updateInterval = setInterval(() => this.updateDisplay(), 1000);
    }

    updateDisplay() {
        const timeRemaining = this.calculateTimeRemaining();
        if (timeRemaining < 0) {
            this.showGameStarted();
            this.cleanup();
            return;
        }

        this.container.textContent = this.formatter.formatTimeRemaining(timeRemaining);
    }

    calculateTimeRemaining() {
        return new Date(this.gameData.time) - new Date();
    }

    showGameStarted() {
        this.container.innerHTML = `
            <div class="game-time-warning">
                Game has started
            </div>
        `;
    }

    cleanup() {
        clearInterval(this.updateInterval);
    }

    // ... additional helper methods
}