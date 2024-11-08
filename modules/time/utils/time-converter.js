// modules/time/utils/time-converter.js
export class TimeConverter {
    parseGameTime(timeString) {
        const [time, period] = timeString.split(/\s+/);
        const [hours, minutes] = time.split(':').map(Number);

        const date = new Date();
        let hour = this.adjustHour(hours, period);
        date.setHours(hour, minutes || 0, 0, 0);

        return date;
    }

    adjustHour(hour, period) {
        if (!period) return hour;

        if (period.toUpperCase() === 'PM' && hour < 12) return hour + 12;
        if (period.toUpperCase() === 'AM' && hour === 12) return 0;
        return hour;
    }

    convertToZone(date, targetZone) {
        return date.toLocaleTimeString('en-US', {
            timeZone: targetZone,
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

// modules/time/utils/time-formatter.js
export class TimeFormatter {
    formatTimeRemaining(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        return `Time until game: ${hours}h ${minutes}m ${seconds}s`;
    }

    formatCurrentTime(date, zone) {
        return date.toLocaleTimeString('en-US', {
            timeZone: zone,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// modules/time/utils/time-constants.js
export const TIME_ZONES = [
    { label: 'ET', zone: 'America/New_York' },
    { label: 'CT', zone: 'America/Chicago' },
    { label: 'MT', zone: 'America/Denver' },
    { label: 'AZ', zone: 'America/Phoenix' },
    { label: 'PT', zone: 'America/Los_Angeles' },
    { label: 'Local', zone: Intl.DateTimeFormat().resolvedOptions().timeZone }
];