const uiUtils = {
    async initialize() {
        this.addGlobalStyles();
    },

    // Add the missing addStyles method
    addStyles(styles) {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    },

    addGlobalStyles() {
        const styles = `
            .psm-panel {
                position: fixed;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                font-family: Arial, sans-serif;
            }

            .psm-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #dee2e6;
                background: #f8f9fa;
                border-radius: 8px 8px 0 0;
            }

            .psm-panel-content {
                padding: 15px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .psm-button {
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                background: #007bff;
                color: white;
            }

            .psm-button:hover {
                background: #0056b3;
            }

            .psm-button:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .psm-input {
                padding: 5px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                font-size: 14px;
                width: 100%;
            }

            .psm-select {
                padding: 5px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                font-size: 14px;
                width: 100%;
            }

            .psm-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 4px;
                color: white;
                font-size: 14px;
                z-index: 1001;
                animation: slideIn 0.3s ease-out;
            }

            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }

            .psm-notification.success { background: #28a745; }
            .psm-notification.error { background: #dc3545; }
            .psm-notification.warning { background: #ffc107; color: #000; }
            .psm-notification.info { background: #17a2b8; }
        `;
        this.addStyles(styles);
    },

    // Rest of the uiUtils methods remain the same...
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

    formatDate(date) {
        return new Date(date).toLocaleString();
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

window.uiUtils = uiUtils;