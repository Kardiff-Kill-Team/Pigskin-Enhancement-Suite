# Pigskin Enhancement Suite

A comprehensive enhancement suite for [PigSkin Mania](http://pigskinmania.net) that adds various quality-of-life improvements to the site.

## Features

### Spreads Page Enhancements
- **Time Zone Management**
    - Support for ET, CT, MT, AZ, and PT time zones
    - Auto-conversion of game times
    - Current time display in selected zone
- **Team Standardization**
    - Wikipedia-based team name normalization
    - Consistent team naming across pages
- **Visual Improvements**
    - Highlight your selected teams
    - Clear spread indicators

### Picks Form Features
- **Lock Management**
    - Dynamic lock dropdown updates
    - Visual lock status indicator
    - Lock validation and warnings
- **Game Time Validation**
    - Countdown timers for each game
    - Warnings for games that have started
    - Time zone aware validations
- **Picks History**
    - Track all your picks
    - Export to JSON or CSV
    - Historical performance statistics

### User Management
- **ID Management**
    - Save and auto-fill your user ID
    - Track recent IDs
    - Smart ID change detection
- **Settings Persistence**
    - Auto-fill preferences
    - Time zone preferences
    - Visual preferences

### Standings Page Features
- **Player Bookmarking**
    - Quick bookmark any player
    - Jump to bookmarked players
    - Search and filter capabilities
- **Visual Enhancements**
    - Highlight bookmarked players
    - Visual bookmark indicators
    - Flash animations for navigation

## Installation

1. Install a userscript manager:
    - [Chrome: Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    - [Firefox: Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    - [Edge: Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. Install the script:
    - Click here to install: [Pigskin Enhancement Suite](https://raw.githubusercontent.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/main/main-script.js)
    - Click "Install" when prompted by Tampermonkey

The script will automatically update when new versions are released.

## Usage

The suite automatically activates on the following pages:

### Spreads Page (http://pigskinmania.net/spreads/index.html)
- Use time zone buttons to convert all times
- Hover over teams to see additional information
- Your picks from the current week are highlighted

### Picks Form (http://pigskinmania.net/forms/fbpicks.html)
- Spreads are automatically added to team names
- Lock dropdown updates based on your selections
- Warnings appear for games that have started
- ID is auto-filled if previously saved

### Standings Page (http://pigskinmania.net/standings/index.html)
- Click ★ next to any player to bookmark them
- Use the bookmarks panel to quickly navigate
- Search players using the search box

## Development

To contribute to the development:

1. Clone the repository:
```bash
git clone https://github.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite.git
```

2. Repository Structure:
```
Pigskin-Enhancement-Suite/
├── modules/
│   ├── utils/
│   │   ├── storageUtils.js     # Storage management utilities
│   │   └── uiUtils.js          # UI helper functions
│   ├── spreadsModule.js        # Spreads page functionality
│   ├── picksModule.js          # Picks form enhancements
│   ├── lockModule.js           # Lock selection management
│   ├── wikiTeamModule.js       # Team name standardization
│   ├── timeModule.js           # Time zone management
│   ├── picksHistoryModule.js   # Historical picks tracking
│   ├── userIdModule.js         # User ID management
│   └── standingsModule.js      # Standings page features
├── LICENSE.md
├── README.md
└── main-script.js             # Main script entry point
```

3. Making Changes:
    - Each module is independent and follows a standard interface
    - Use the utility modules for common functionality
    - Test changes on all affected pages
    - Submit pull requests with clear descriptions

## Support

If you encounter issues or have suggestions:

1. Check existing [Issues](https://github.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/issues)
2. Create a new issue if needed
3. Include:
    - Browser and version
    - Tampermonkey version
    - Steps to reproduce
    - Expected vs actual behavior

## Credits

- NFL team data: Wikipedia
- Original site: PigSkin Mania (http://pigskinmania.net)
- Contributors: See [GitHub Contributors](https://github.com/Kardiff-Kill-Team/Pigskin-Enhancement-Suite/graphs/contributors)

## License

[MIT License](LICENSE.md) - Feel free to use and modify, but maintain attribution.