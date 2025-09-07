// BhashaZap Extension - Content Script
// Version 2.0 - Enhanced with Dictionary API Integration

class BhashaZap {
    constructor() {
        this.isActive = false;
        this.selectedLanguages = ['english', 'kannada', 'telugu'];
        this.currentDefinitions = {    // Load settings from storage
    loadSettings() {
        chrome.storage.sync.get(['enabled', 'languages', 'popupDuration'], (result) => {
            this.isActive = result.enabled !== false; // Default to true
            this.selectedLanguages = result.languages || ['english', 'kannada', 'telugu'];
            this.popupDuration = result.popupDuration || 10; // Default 10 seconds
        });
    }
}

// Initialize BhashaZap when content script loads
let bhashaZap;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bhashaZap = new BhashaZap();
    });
} else {
    bhashaZap = new BhashaZap();
}

// Export for potential future use
window.BhashaZap = BhashaZap;;
        this.popup = null;
        this.init();
    }

    init() {
        this.createPopup();
        this.addEventListeners();
        this.loadSettings();
    }

    // Create the translation popup
    createPopup() {
        // Remove existing popup if any
        const existingPopup = document.getElementById('bhashazap-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        this.popup = document.createElement('div');
        this.popup.id = 'bhashazap-popup';
        this.popup.innerHTML = `
            <div class="bhashazap-header">
                <div class="bhashazap-word-title" id="bhashazap-word"></div>
                <button class="bhashazap-close" id="bhashazap-close">×</button>
            </div>
            <div class="bhashazap-content" id="bhashazap-content">
                <div class="bhashazap-loading">Loading...</div>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
        document.body.appendChild(this.popup);

        // Add close button event
        document.getElementById('bhashazap-close').addEventListener('click', () => {
            this.hidePopup();
        });
    }

    // Add CSS styles for the popup
    addStyles() {
        const existingStyle = document.getElementById('bhashazap-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'bhashazap-styles';
        style.textContent = `
            #bhashazap-popup {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 320px;
                max-width: 450px;
                max-height: 500px;
                overflow: hidden;
                animation: bhashazap-fadeIn 0.3s ease-out;
            }

            @keyframes bhashazap-fadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            .bhashazap-header {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }

            .bhashazap-word-title {
                font-size: 18px;
                font-weight: bold;
                text-transform: capitalize;
            }

            .bhashazap-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .bhashazap-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .bhashazap-content {
                background: white;
                max-height: 400px;
                overflow-y: auto;
                padding: 0;
            }

            .bhashazap-loading {
                padding: 30px;
                text-align: center;
                color: #666;
                font-style: italic;
            }

            .bhashazap-section {
                padding: 20px;
                border-bottom: 1px solid #f0f0f0;
            }

            .bhashazap-section:last-child {
                border-bottom: none;
            }

            .bhashazap-lang-header {
                font-weight: bold;
                color: #667eea;
                font-size: 14px;
                text-transform: uppercase;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }

            .bhashazap-definition {
                color: #333;
                line-height: 1.6;
                margin-bottom: 8px;
            }

            .bhashazap-phonetic {
                color: #666;
                font-style: italic;
                font-size: 14px;
                margin-bottom: 8px;
            }

            .bhashazap-part-speech {
                background: #f0f4ff;
                color: #667eea;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                display: inline-block;
                margin-bottom: 8px;
            }

            .bhashazap-example {
                background: #f8f9fa;
                border-left: 3px solid #667eea;
                padding: 8px 12px;
                margin: 8px 0;
                font-style: italic;
                color: #555;
                border-radius: 0 4px 4px 0;
            }

            .bhashazap-translation {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 10px;
                margin: 5px 0;
                color: #856404;
            }

            .bhashazap-error {
                color: #dc3545;
                text-align: center;
                padding: 20px;
                font-style: italic;
            }

            .bhashazap-translation-note {
                background: #e3f2fd;
                border: 1px solid #90caf9;
                border-radius: 6px;
                padding: 8px 10px;
                margin: 8px 0;
                color: #1565c0;
                font-size: 12px;
            }

            .bhashazap-no-definition {
                color: #6c757d;
                text-align: center;
                padding: 15px;
                font-style: italic;
                background: #f8f9fa;
            }

            /* Scrollbar styling */
            .bhashazap-content::-webkit-scrollbar {
                width: 6px;
            }

            .bhashazap-content::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .bhashazap-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .bhashazap-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        document.head.appendChild(style);
    }

    // Add event listeners
    addEventListeners() {
        // Double-click to get definition
        document.addEventListener('dblclick', (e) => {
            if (this.isActive) {
                const selectedText = this.getSelectedText();
                if (selectedText && selectedText.length > 0) {
                    this.handleWordClick(selectedText, e);
                }
            }
        });

        // Single click on words (for future enhancement)
        document.addEventListener('click', (e) => {
            if (this.isActive && e.ctrlKey) {
                const word = this.getWordAtCursor(e);
                if (word) {
                    this.handleWordClick(word, e);
                }
            }
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popup && !this.popup.contains(e.target) && this.popup.style.display === 'block') {
                this.hidePopup();
            }
        });

        // Listen for messages from popup/background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                this.isActive = request.enabled;
                sendResponse({success: true});
            } else if (request.action === 'updateLanguages') {
                this.selectedLanguages = request.languages;
                sendResponse({success: true});
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup && this.popup.style.display === 'block') {
                this.hidePopup();
            }
        });
    }

    // Get selected text
    getSelectedText() {
        const selection = window.getSelection();
        return selection.toString().trim();
    }

    // Get word at cursor position
    getWordAtCursor(e) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (!range) return null;

        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return null;

        const text = textNode.textContent;
        const offset = range.startOffset;

        // Find word boundaries
        let start = offset;
        let end = offset;

        while (start > 0 && /\w/.test(text[start - 1])) start--;
        while (end < text.length && /\w/.test(text[end])) end++;

        return text.substring(start, end).trim();
    }

    // Handle word click/selection
    async handleWordClick(word, event) {
        if (!word || word.length < 2) return;

        const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');
        if (!cleanWord) return;

        this.showPopup();
        document.getElementById('bhashazap-word').textContent = word;
        
        try {
            await this.fetchDefinitions(cleanWord);
        } catch (error) {
            console.error('BhashaZap error:', error);
            this.showError('Failed to fetch definitions. Please try again.');
        }
    }

    // Fetch definitions from multiple sources
    async fetchDefinitions(word) {
        document.getElementById('bhashazap-content').innerHTML = '<div class="bhashazap-loading">Fetching definitions...</div>';

        const promises = [];

        // Fetch English definition
        if (this.selectedLanguages.includes('english')) {
            promises.push(this.fetchEnglishDefinition(word));
        }

        // Fetch translations (if other languages are selected)
        const translationLanguages = this.selectedLanguages.filter(lang => lang !== 'english');
        if (translationLanguages.length > 0) {
            promises.push(this.fetchTranslations(word, translationLanguages));
        }

        try {
            const results = await Promise.allSettled(promises);
            this.displayResults(results, word);
        } catch (error) {
            this.showError('Failed to fetch definitions');
        }
    }

    // Fetch English definition from Free Dictionary API
    async fetchEnglishDefinition(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) {
                throw new Error('Definition not found');
            }
            const data = await response.json();
            return { type: 'english', data: data[0] };
        } catch (error) {
            throw new Error(`English definition: ${error.message}`);
        }
    }

    // Fetch translations using Google Translate API (Alternative: MyMemory API)
    async fetchTranslations(word, languages) {
        const translations = {};
        
        for (const lang of languages) {
            try {
                const langCode = this.getLanguageCode(lang);
                // Using MyMemory Translation API (free tier)
                const response = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${langCode}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.responseData && data.responseData.translatedText) {
                        translations[lang] = data.responseData.translatedText;
                    }
                }
            } catch (error) {
                console.warn(`Translation failed for ${lang}:`, error);
            }
        }
        
        return { type: 'translations', data: translations };
    }

    // Get language code for translation API
    getLanguageCode(language) {
        const codes = {
            'kannada': 'kn',
            'telugu': 'te',
            'hindi': 'hi',
            'tamil': 'ta',
            'malayalam': 'ml',
            'bengali': 'bn',
            'gujarati': 'gu',
            'marathi': 'mr',
            'punjabi': 'pa'
        };
        return codes[language] || 'en';
    }

    // Display results in popup
    displayResults(results, word) {
        let content = '';
        let hasContent = false;

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { type, data } = result.value;

                if (type === 'english' && data) {
                    content += this.formatEnglishDefinition(data);
                    hasContent = true;
                } else if (type === 'translations' && data && Object.keys(data).length > 0) {
                    content += this.formatTranslations(data);
                    hasContent = true;
                }
            }
        });

        if (!hasContent) {
            content = `<div class="bhashazap-no-definition">No definitions found for "${word}". Try checking the spelling or try a different word.</div>`;
        }

        document.getElementById('bhashazap-content').innerHTML = content;
    }

    // Format English definition
    formatEnglishDefinition(data) {
        let html = '<div class="bhashazap-section">';
        html += '<div class="bhashazap-lang-header">English</div>';

        if (data.phonetic) {
            html += `<div class="bhashazap-phonetic">/${data.phonetic}/</div>`;
        }

        data.meanings.forEach(meaning => {
            html += `<div class="bhashazap-part-speech">${meaning.partOfSpeech}</div>`;
            
            meaning.definitions.slice(0, 2).forEach(def => {
                html += `<div class="bhashazap-definition">${def.definition}</div>`;
                if (def.example) {
                    html += `<div class="bhashazap-example">"${def.example}"</div>`;
                }
            });
        });

        html += '</div>';
        return html;
    }

    // Format translations
    formatTranslations(translations) {
        let html = '';
        
        Object.entries(translations).forEach(([lang, translation]) => {
            html += '<div class="bhashazap-section">';
            html += `<div class="bhashazap-lang-header">${lang.toUpperCase()}</div>`;
            html += `<div class="bhashazap-translation">${translation}</div>`;
            html += '</div>';
        });

        return html;
    }

    // Show popup
    showPopup() {
        this.popup.style.display = 'block';
    }

    // Hide popup
    hidePopup() {
        this.popup.style.display = 'none';
    }

    // Show error message
    showError(message) {
        document.getElementById('bhashazap-content').innerHTML = 
            `<div class="bhashazap-error">${message}</div>`;
    }

    // Load settings from storage
    loadSettings() {
        chrome.storage.sync.get(['enabled', 'languages'], (result) => {
            this.isActive = result.enabled !== false; // Default to true
            this.selectedLanguages = result.languages || ['english', 'kannada', 'telugu'];
        });
    }
}

// Initialize BhashaZap when content script loads
let bhashaZap;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bhashaZap = new BhashaZap();
    });
} else {
    bhashaZap = new BhashaZap();
}

// Export for potential future use
window.BhashaZap = BhashaZap;