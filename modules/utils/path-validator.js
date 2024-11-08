// pathValidator.js
const pathValidator = {
    REPO_BASE: 'Kardiff-Kill-Team/Pigskin-Enhancement-Suite',
    REPO_RAW_BASE: 'https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main',
    
    validatePaths(moduleContent) {
        const issues = [];
        
        // Check for old repository names
        if (moduleContent.includes('pigskin-enhancements')) {
            issues.push('Found old repository name: pigskin-enhancements');
        }
        
        // Check @require statements
        const requirePattern = /@require\s+(https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/.*)/g;
        const requires = [...moduleContent.matchAll(requirePattern)];
        requires.forEach(match => {
            if (!match[1].startsWith(this.REPO_RAW_BASE)) {
                issues.push(`Invalid @require path: ${match[1]}`);
            }
        });
        
        // Check for raw.githubusercontent.com URLs
        const urlPattern = /https:\/\/raw\.githubusercontent\.com\/[^/'"]+\/[^/'"]+\/[^/'"]+\/[^'"]+/g;
        const urls = [...moduleContent.matchAll(urlPattern)];
        urls.forEach(match => {
            if (!match[0].startsWith(this.REPO_RAW_BASE)) {
                issues.push(`Invalid raw URL: ${match[0]}`);
            }
        });
        
        // Check for repository references
        const repoPattern = /github\.com\/[^/'"]+\/[^/'"]+/g;
        const repos = [...moduleContent.matchAll(repoPattern)];
        repos.forEach(match => {
            if (!match[0].includes(this.REPO_BASE)) {
                issues.push(`Invalid repository reference: ${match[0]}`);
            }
        });
        
        return issues;
    },

    generateCorrectPath(oldPath) {
        // Convert any old path to the correct new path
        return oldPath.replace(
            /github\.com\/[^/]+\/[^/]+/,
            `github.com/${this.REPO_BASE}`
        );
    }
};

window.pathValidator = pathValidator;
