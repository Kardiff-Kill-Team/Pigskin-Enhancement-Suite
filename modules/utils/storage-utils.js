const storageUtils = {
    async initialize() {
        // Initialize storage structure if needed
        const structure = await GM.getValue('storageStructure', null);
        if (!structure) {
            await this.initializeStorage();
        }
    },

    async initializeStorage() {
        const initialStructure = {
            version: '1.0.0',
            lastUpdate: Date.now(),
            data: {
                picks: {},
                spreads: {},
                settings: {},
                userId: null
            }
        };
        await GM.setValue('storageStructure', initialStructure);
    },

    async get(key, defaultValue = null) {
        try {
            return await GM.getValue(key, defaultValue);
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    async set(key, value) {
        try {
            await GM.setValue(key, value);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    async append(key, value) {
        try {
            const current = await this.get(key, []);
            if (Array.isArray(current)) {
                current.push(value);
                await this.set(key, current);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Storage append error:', error);
            return false;
        }
    },

    async update(key, updateFn) {
        try {
            const current = await this.get(key);
            const updated = updateFn(current);
            await this.set(key, updated);
            return true;
        } catch (error) {
            console.error('Storage update error:', error);
            return false;
        }
    },

    generateKey(...parts) {
        return parts.join('_');
    }
};

window.storageUtils = storageUtils;
