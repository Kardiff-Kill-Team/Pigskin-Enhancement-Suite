// modules/time/styles/time-styles.js
export const TIME_STYLES = `
    .time-panel {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1001;
        padding: 10px;
        margin-bottom: 10px;
    }

    .time-zone-buttons {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        margin-bottom: 10px;
    }

    .time-zone-btn {
        padding: 5px 10px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        cursor: pointer;
        background: #f8f9fa;
        transition: all 0.2s;
    }

    .time-zone-btn.active {
        background: #007bff;
        color: white;
        border-color: #0056b3;
    }

    .time-zone-btn:hover {
        background: #e9ecef;
    }

    .time-zone-btn.active:hover {
        background: #0056b3;
    }

    .game-time {
        transition: background-color 0.3s;
    }

    .game-time.updated {
        background-color: #fff3cd;
    }

    .game-time-warning {
        color: #dc3545;
        font-weight: bold;
    }

    .countdown-timer {
        font-size: 0.9em;
        color: #6c757d;
        margin-top: 5px;
    }
`;