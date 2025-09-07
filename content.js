// BhashaZap Extension - Content Script
// Version 2.0 - Enhanced with Dictionary API Integration

class BhashaZap {
    constructor() {
        this.isActive = false;
        this.selectedLanguages = ['english', 'kannada', 'telugu'];
        this.currentDefinitions = {};
        this.popup = null;
        this.popupDuration = 10; // Default 10 seconds
        this.timerInterval = null;
        this.currentTimer = 0;
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
                <div class="bhashazap-version">BhashaZap 2.0.0</div>
                <button class="bhashazap-close" id="bhashazap-close">×</button>
            </div>
            <div class="bhashazap-timer-container" id="bhashazap-timer-container">
                <div class="bhashazap-timer-text" id="bhashazap-timer-text"></div>
                <div class="bhashazap-progress-bar">
                    <div class="bhashazap-progress-fill" id="bhashazap-progress-fill"></div>
                </div>
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
                position: relative;
            }

            .bhashazap-word-title {
                font-size: 18px;
                font-weight: bold;
                text-transform: capitalize;
                flex: 1;
            }

            .bhashazap-version {
                font-size: 12px;
                color: rgba(255,255,255,0.8);
                font-weight: normal;
                margin-right: 15px;
                background: rgba(255,255,255,0.1);
                padding: 4px 8px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.2);
            }

            .bhashazap-timer-container {
                background: rgba(255,255,255,0.05);
                padding: 10px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: none;
            }

            .bhashazap-timer-text {
                color: white;
                font-size: 12px;
                text-align: center;
                margin-bottom: 6px;
                font-weight: 500;
            }

            .bhashazap-progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                overflow: hidden;
            }

            .bhashazap-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
                width: 100%;
                border-radius: 2px;
                transition: width 0.1s linear;
                transform-origin: left;
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

            .bhashazap-translation-note {
                background: #e3f2fd;
                border: 1px solid #90caf9;
                border-radius: 6px;
                padding: 8px 10px;
                margin: 8px 0;
                color: #1565c0;
                font-size: 12px;
            }

            .bhashazap-error {
                color: #dc3545;
                text-align: center;
                padding: 20px;
                font-style: italic;
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
            } else if (request.action === 'updateDuration') {
                this.popupDuration = request.duration;
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

        // Fetch definitions for each selected language
        this.selectedLanguages.forEach(language => {
            if (language === 'english') {
                promises.push(this.fetchEnglishDefinition(word));
            } else {
                promises.push(this.fetchIndianLanguageDefinition(word, language));
            }
        });

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

    // Fetch Indian language definitions
    async fetchIndianLanguageDefinition(word, language) {
        try {
            // First, try to get definition from Indian language dictionaries
            let definition = await this.tryMultipleIndianSources(word, language);
            
            if (!definition) {
                // Fallback: Get English definition and translate it
                definition = await this.getTranslatedDefinition(word, language);
            }

            return {
                type: 'indian_language',
                language: language,
                data: definition
            };
        } catch (error) {
            throw new Error(`${language} definition: ${error.message}`);
        }
    }

    // Try multiple sources for Indian language definitions
    async tryMultipleIndianSources(word, language) {
        const sources = [
            () => this.fetchFromShabdkosh(word, language),
            () => this.fetchFromIndianDictAPI(word, language),
            () => this.fetchFromWiktionary(word, language),
            () => this.fetchFromGoogleDefine(word, language)
        ];

        for (const source of sources) {
            try {
                const result = await source();
                if (result && result.definition) {
                    return result;
                }
            } catch (error) {
                console.warn(`Source failed for ${language}:`, error.message);
                continue;
            }
        }

        return null;
    }

    // Fetch from Shabdkosh API (Hindi/Indian languages)
    async fetchFromShabdkosh(word, language) {
        if (language !== 'hindi') return null;
        
        try {
            // Shabdkosh API endpoint (if available)
            const response = await fetch(`https://api.shabdkosh.com/dictionary/meaning/${word}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.meanings && data.meanings.length > 0) {
                    return {
                        definition: data.meanings[0].definition,
                        pronunciation: data.pronunciation,
                        examples: data.examples || []
                    };
                }
            }
        } catch (error) {
            console.warn('Shabdkosh API failed:', error);
        }
        return null;
    }

    // Fetch from Indian Dictionary API
    async fetchFromIndianDictAPI(word, language) {
        try {
            const langCode = this.getLanguageCode(language);
            // Using a generic Indian dictionary API (hypothetical)
            const response = await fetch(`https://api.indiandictionary.com/v1/define?word=${word}&lang=${langCode}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.definitions && data.definitions.length > 0) {
                    return {
                        definition: data.definitions[0].meaning,
                        pronunciation: data.pronunciation,
                        examples: data.examples || [],
                        partOfSpeech: data.partOfSpeech
                    };
                }
            }
        } catch (error) {
            console.warn('Indian Dict API failed:', error);
        }
        return null;
    }

    // Fetch from Wiktionary
    async fetchFromWiktionary(word, language) {
        try {
            const langCode = this.getWiktionaryLanguageCode(language);
            const response = await fetch(
                `https://${langCode}.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.extract) {
                    return {
                        definition: data.extract,
                        examples: []
                    };
                }
            }
        } catch (error) {
            console.warn('Wiktionary failed:', error);
        }
        return null;
    }

    // Fetch using Google Define (web scraping alternative)
    async fetchFromGoogleDefine(word, language) {
        try {
            const langCode = this.getLanguageCode(language);
            // This would require a proxy service to handle CORS
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
                `https://www.google.com/search?q=define+${word}+in+${language}`
            )}`;
            
            // Note: This is a simplified example and would need proper implementation
            return null;
        } catch (error) {
            console.warn('Google Define failed:', error);
        }
        return null;
    }

    // Get translated definition as fallback
    async getTranslatedDefinition(word, language) {
        try {
            // First get English definition
            const englishDef = await this.fetchEnglishDefinition(word);
            if (!englishDef || !englishDef.data) return null;

            // Extract the first definition
            let definitionText = '';
            if (englishDef.data.meanings && englishDef.data.meanings.length > 0) {
                const firstMeaning = englishDef.data.meanings[0];
                if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                    definitionText = firstMeaning.definitions[0].definition;
                }
            }

            if (!definitionText) return null;

            // Translate the definition
            const langCode = this.getLanguageCode(language);
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(definitionText)}&langpair=en|${langCode}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.responseData && data.responseData.translatedText) {
                    return {
                        definition: data.responseData.translatedText,
                        translatedFrom: 'english',
                        examples: [],
                        note: 'Translated from English definition'
                    };
                }
            }
        } catch (error) {
            console.warn('Translated definition failed:', error);
        }
        return null;
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

    // Get Wiktionary language codes
    getWiktionaryLanguageCode(language) {
        const codes = {
            'hindi': 'hi',
            'kannada': 'kn',
            'telugu': 'te',
            'tamil': 'ta',
            'malayalam': 'ml',
            'bengali': 'bn',
            'gujarati': 'gu',
            'marathi': 'mr',
            'punjabi': 'pa',
            'english': 'en'
        };
        return codes[language] || 'en';
    }

    // Display results in popup
    displayResults(results, word) {
        let content = '';
        let hasContent = false;
        
        // Separate results by type
        let englishResult = null;
        let indianResults = [];

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { type, data, language } = result.value;

                if (type === 'english' && data) {
                    englishResult = { type, data };
                    hasContent = true;
                } else if (type === 'indian_language' && data) {
                    indianResults.push({ type, data, language });
                    hasContent = true;
                }
            } else {
                // Handle rejected promises - show language with error
                const error = result.reason.message;
                if (error.includes('kannada') || error.includes('telugu') || error.includes('hindi')) {
                    const lang = error.split(' ')[0];
                    indianResults.push({ type: 'error', language: lang, word });
                }
            }
        });

        // Display Indian languages first
        indianResults.forEach(result => {
            if (result.type === 'indian_language') {
                content += this.formatIndianLanguageDefinition(result.data, result.language);
            } else if (result.type === 'error') {
                content += this.formatLanguageError(result.language, result.word);
            }
        });

        // Display English last
        if (englishResult) {
            content += this.formatEnglishDefinition(englishResult.data);
        }

        if (!hasContent) {
            content = `<div class="bhashazap-no-definition">No definitions found for "${word}" in selected languages. Try checking the spelling or try a different word.</div>`;
        }

        document.getElementById('bhashazap-content').innerHTML = content;
        
        // Start timer if duration is set
        this.startAutoCloseTimer();
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

    // Format Indian language definition
    formatIndianLanguageDefinition(data, language) {
        let html = '<div class="bhashazap-section">';
        html += `<div class="bhashazap-lang-header">${this.getLanguageDisplayName(language)}</div>`;

        if (data.pronunciation) {
            html += `<div class="bhashazap-phonetic">उच्चारण: ${data.pronunciation}</div>`;
        }

        if (data.partOfSpeech) {
            html += `<div class="bhashazap-part-speech">${data.partOfSpeech}</div>`;
        }

        html += `<div class="bhashazap-definition">${data.definition}</div>`;

        if (data.examples && data.examples.length > 0) {
            data.examples.slice(0, 2).forEach(example => {
                html += `<div class="bhashazap-example">"${example}"</div>`;
            });
        }

        if (data.translatedFrom) {
            html += `<div class="bhashazap-translation-note">📝 ${data.note}</div>`;
        }

        html += '</div>';
        return html;
    }

    // Format language error
    formatLanguageError(language, word) {
        let html = '<div class="bhashazap-section">';
        html += `<div class="bhashazap-lang-header">${this.getLanguageDisplayName(language)}</div>`;
        html += `<div class="bhashazap-no-definition">Definition not available for "${word}" in ${language}</div>`;
        html += '</div>';
        return html;
    }

    // Get display name for language
    getLanguageDisplayName(language) {
        const names = {
            'english': 'English',
            'hindi': 'हिंदी (Hindi)',
            'kannada': 'ಕನ್ನಡ (Kannada)',
            'telugu': 'తెలుగు (Telugu)',
            'tamil': 'தமிழ் (Tamil)',
            'malayalam': 'മലയാളം (Malayalam)',
            'bengali': 'বাংলা (Bengali)',
            'gujarati': 'ગુજરાતી (Gujarati)',
            'marathi': 'मराठी (Marathi)',
            'punjabi': 'ਪੰਜਾਬੀ (Punjabi)'
        };
        return names[language] || language.toUpperCase();
    }

    // Start auto-close timer
    startAutoCloseTimer() {
        // Clear any existing timer
        this.stopAutoCloseTimer();
        
        if (this.popupDuration > 0) {
            this.currentTimer = 0;
            const timerContainer = document.getElementById('bhashazap-timer-container');
            const timerText = document.getElementById('bhashazap-timer-text');
            const progressFill = document.getElementById('bhashazap-progress-fill');
            
            timerContainer.style.display = 'block';
            
            this.timerInterval = setInterval(() => {
                this.currentTimer++;
                const remainingTime = this.popupDuration - this.currentTimer;
                const progressPercentage = (this.currentTimer / this.popupDuration) * 100;
                
                timerText.textContent = `Auto-close in ${remainingTime} seconds (${this.currentTimer}/${this.popupDuration})`;
                progressFill.style.width = `${100 - progressPercentage}%`;
                
                if (this.currentTimer >= this.popupDuration) {
                    this.hidePopup();
                }
            }, 1000);
        }
    }

    // Stop auto-close timer
    stopAutoCloseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const timerContainer = document.getElementById('bhashazap-timer-container');
        if (timerContainer) {
            timerContainer.style.display = 'none';
        }
    }

    // Show popup
    showPopup() {
        this.popup.style.display = 'block';
    }

    // Hide popup
    hidePopup() {
        this.stopAutoCloseTimer();
        this.popup.style.display = 'none';
    }

    // Show error message
    showError(message) {
        document.getElementById('bhashazap-content').innerHTML = 
            `<div class="bhashazap-error">${message}</div>`;
        this.startAutoCloseTimer();
    }

    // Load settings from storage
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

console.log('BhashaZap: Content script loading...');
console.log('BhashaZap: Document ready state:', document.readyState);

if (document.readyState === 'loading') {
    console.log('BhashaZap: Waiting for DOM to load...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('BhashaZap: DOM loaded, initializing...');
        bhashaZap = new BhashaZap();
    });
} else {
    console.log('BhashaZap: DOM already loaded, initializing immediately...');
    bhashaZap = new BhashaZap();
}

// Export for potential future use
window.BhashaZap = BhashaZap;