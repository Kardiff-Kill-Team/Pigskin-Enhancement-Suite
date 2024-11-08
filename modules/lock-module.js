const lockModule = {
    async initialize() {
        if (!window.location.pathname.includes('fbpicks')) return;
        
        this.setupLockDropdown();
        this.addLockPanel();
    },

    setupLockDropdown() {
        const lockDropdown = this.getLockDropdown();
        if (!lockDropdown) return;

        // Style the lock dropdown
        lockDropdown.classList.add('psm-select');
        lockDropdown.style.border = '2px solid #28a745';

        // Add change listener to regular dropdowns
        const gameDropdowns = Array.from(document.querySelectorAll('select'))
            .filter(dropdown => !this.isLockDropdown(dropdown));

        gameDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', () => {
                this.updateLockDropdown();
            });
        });

        // Add change listener to lock dropdown
        lockDropdown.addEventListener('