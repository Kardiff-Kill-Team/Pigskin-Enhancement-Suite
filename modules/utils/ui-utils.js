const uiUtils = {
    initialized: false,

    async initialize() {
        if (this.initialized) return;

        try {
            // Wait for document to be ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => window.addEventListener('load', resolve));
            }

            // Add global styles
            await this.addGlobalStyles();

            // Mark as initialized
            this.initialized = true;

            return true;
        } catch (error) {
            console.error('uiUtils initialization error:', error);
            return false;
        }
    },

    // Define addStyles at the root level
    addStyles(styles) {
        if (!document.head) {
            throw new Error('Document head not available');
        }
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    },

    async addGlobalStyles() {
        const styles = `
            .psm-panel {
                position: fixed;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                font-family: Arial, sans-serif;
            }
            /* ... rest of your styles ... */
        `;

        this.addStyles(styles);
    },

    createPanel(options = {}) {
        const panel = document.createElement('div');
        panel.className = 'psm-panel';
        Object.assign(panel.style, {
            top: options.top || '20px',
            right: options.right || 'auto',
            left: options.left || 'auto',
            bottom: options.bottom || 'auto',
            width: options.width || '300px'
        });

        return panel;
    },

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `psm-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    createModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'psm-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'psm-modal-content';

        if (typeof content === 'string') {
            modalContent.innerHTML = content;
        } else {
            modalContent.appendChild(content);
        }

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        if (options.closeOnClick) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        return {
            modal,
            close: () => modal.remove()
        };
    },

    createElement(type, options = {}) {
        const element = document.createElement(type);

        if (options.className) {
            element.className = options.className;
        }

        if (options.text) {
            element.textContent = options.text;
        }

        if (options.html) {
            element.innerHTML = options.html;
        }

        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        if (options.styles) {
            Object.assign(element.style, options.styles);
        }

        return element;
    }
};

// Make sure it's available globally
if (typeof window !== 'undefined') {
    window.uiUtils = uiUtils;
}

// For module systems
export default uiUtils;