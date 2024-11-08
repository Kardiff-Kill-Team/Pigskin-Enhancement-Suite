// modules/time/components/time-zone-panel.js
import { TIME_ZONES } from '../utils/time-constants';

export class TimeZonePanel {
    constructor() {
        this.panel = null;
        this.activeZone = null;
        this.updateInterval = null;
    }

    async initialize() {
        this.panel = await this.createPanel();
        this.setupEventListeners();
        this.startTimeUpdates();
        await this.storeOriginalTimes();
    }

    async createPanel() {
        const panel = window.uiUtils.createElement('div', {
            className: 'time-panel',
            styles: {
                top: '20px',
                right: '20px',
                zIndex: '1000',
                background: '#ffffff'
            }
        });

        panel.innerHTML = this.generatePanelHTML();
        document.body.appendChild(panel);
        return panel;
    }

    generatePanelHTML() {
        return `
            <div class="psm-panel-header">
                <strong>Time Zones</strong>
            </div>
            <div class="psm-panel-content">
                <div class="time-zone-buttons">
                    ${TIME_ZONES.map(zone => this.generateZoneButton(zone)).join('')}
                </div>
                <div id="current-time-display"></div>
            </div>
        `;
    }

    generateZoneButton(zone) {
        return `
            <button class="time-zone-btn" data-zone="${zone.zone}">
                ${zone.label}
            </button>
        `;
    }

    setupEventListeners() {
        this.panel.querySelectorAll('.time-zone-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleZoneChange(e));
        });
    }

    async handleZoneChange(event) {
        const zone = event.target.dataset.zone;
        this.updateActiveZone(event.target);
        await this.convertPageTimes(zone);
    }

    startTimeUpdates() {
        this.updateCurrentTime();
        this.updateInterval = setInterval(() => this.updateCurrentTime(), 1000);
    }

    cleanup() {
        clearInterval(this.updateInterval);
        this.panel?.remove();
    }

    // ... rest of the TimeZonePanel implementation
}