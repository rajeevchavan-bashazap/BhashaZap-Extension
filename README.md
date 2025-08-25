# BhashaZap - Indian Language Translator Extension

BhashaZap is a Chrome extension that allows users to instantly translate words into Indian languages by simply double-clicking on them. Perfect for learning and understanding Indian languages while browsing the web.

## Features

- **Instant Translation**: Double-click any word on any webpage to see its translation
- **10 Indian Languages**: Support for Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, and Punjabi
- **Multi-language Selection**: Choose up to 2 Indian languages simultaneously
- **Customizable Duration**: Set popup display duration from 5-30 seconds
- **Clean Interface**: Modern, responsive popup design
- **Easy Toggle**: Enable/disable extension with one click

## Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "BhashaZap"
3. Click "Add to Chrome"
4. Follow the installation prompts

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your extensions list

## How to Use

### Setup
1. Click the BhashaZap icon in your Chrome toolbar
2. Select up to 2 Indian languages from the list
3. Adjust popup duration if needed (default: 15 seconds)
4. The extension is active by default

### Translating Words
1. Navigate to any webpage
2. Double-click on any English word
3. A popup will appear showing translations in your selected languages
4. The popup will automatically disappear after the set duration
5. Click the '×' button to close manually

### Managing Settings
- **Language Selection**: Check/uncheck languages (maximum 2)
- **Popup Duration**: Choose from 5, 10, 15, 20, or 30 seconds
- **Toggle Extension**: Enable/disable without removing the extension

## File Structure

```
bhashazap-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Main translation logic
├── content.css            # Translation popup styling
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Technical Details

### APIs Used
- **Chrome Extension APIs**: Storage, Tabs, Runtime, Action
- **Translation Service**: MyMemory Translation API (free tier)
- **Manifest Version**: 3 (latest Chrome extension standard)

### Permissions
- `activeTab`: Access current webpage content
- `storage`: Save user preferences
- `contextMenus`: Right-click translation option

### Browser Compatibility
- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Opera, Brave)

## Privacy & Data

- **No Data Collection**: Extension doesn't collect personal information
- **Local Storage**: Settings stored locally using Chrome's storage API
- **API Usage**: Translation requests sent to MyMemory API
- **No Tracking**: No analytics or user behavior tracking

## Troubleshooting

### Extension Not Working
1. Refresh the webpage after installation
2. Check if extension is enabled in chrome://extensions/
3. Ensure you have selected at least one language
4. Verify the extension is not disabled

### Translation Issues
1. Check internet connection
2. Try selecting single words rather than phrases
3. Some technical terms may not translate accurately
4. Refresh page if persistent issues occur

### Popup Not Showing
1. Ensure extension is active (green status)
2. Try double-clicking more precisely on words
3. Check if popup is positioned outside viewport
4. Disable other translation extensions that might conflict

## Development

### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/your-username/bhashazap-extension.git

# Navigate to directory
cd bhashazap-extension

# Load in Chrome Developer Mode
# chrome://extensions/ -> Developer Mode -> Load Unpacked
```

### Making Changes
1. Edit the relevant files
2. Reload the extension in chrome://extensions/
3. Refresh any open webpages to test changes

### Building for Production
1. Remove console.log statements
2. Minify CSS/JS files if needed
3. Optimize images in icons/ folder
4. Test on multiple websites
5. Package as .zip for Chrome Web Store

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 2.0.0
- Complete UI redesign
- Added 10 Indian languages support
- Improved translation accuracy
- Enhanced popup positioning
- Added keyboard shortcuts
- Performance optimizations

### Version 1.0.0
- Initial release
- Basic translation functionality
- Simple popup interface

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Email: support@bhashazap.com
- Visit: https://bhashazap.com/support

## Acknowledgments

- Translation services powered by MyMemory API
- Icons designed using Lucide React
- UI inspired by modern Chrome extension standards
- Thanks to the Indian language community for feedback

---

Made with ❤️ for Indian language learners and enthusiasts!