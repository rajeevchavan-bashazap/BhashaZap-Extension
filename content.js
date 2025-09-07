// BhashaZap Extension - Content Script (Fixed Version)
console.log('BhashaZap: Fixed version loading...');

class BhashaZap {
    constructor() {
        this.isActive = true;
        this.selectedLanguages = ['english', 'kannada', 'telugu'];
        this.popupDuration = 15;
        this.timerInterval = null;
        this.currentTimer = 0;
        this.popup = null;
        this.init();
    }

    init() {
        console.log('BhashaZap: Initializing...');
        this.createPopup();
        this.addEventListeners();
        this.loadSettings();
        console.log('BhashaZap: Initialization complete');
    }

    createPopup() {
        console.log('BhashaZap: Creating popup...');
        
        // Remove existing popup
        const existing = document.getElementById('bhashazap-popup');
        if (existing) {
            existing.remove();
        }

        this.popup = document.createElement('div');
        this.popup.id = 'bhashazap-popup';
        
        // Add styles first
        this.addStyles();
        
        this.popup.innerHTML = `
            <div class="bhashazap-header">
                <div class="bhashazap-word-title" id="bhashazap-word">Word</div>
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
                <div class="bhashazap-loading">Loading definitions...</div>
            </div>
        `;

        document.body.appendChild(this.popup);
        
        // Add close button event - use arrow function to maintain 'this' context
        const closeBtn = document.getElementById('bhashazap-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hidePopup();
            });
        }
        
        console.log('BhashaZap: Popup created successfully');
    }

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
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
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
                flex: 1;
            }

            .bhashazap-version {
                font-size: 12px;
                color: rgba(255,255,255,0.8);
                margin-right: 15px;
                background: rgba(255,255,255,0.1);
                padding: 4px 8px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.2);
            }

            .bhashazap-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
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
        `;
        document.head.appendChild(style);
    }

    addEventListeners() {
        console.log('BhashaZap: Adding event listeners...');
        
        document.addEventListener('dblclick', (e) => {
            console.log('BhashaZap: Double-click detected, isActive:', this.isActive);
            if (this.isActive) {
                const selectedText = this.getSelectedText();
                console.log('BhashaZap: Selected text:', selectedText);
                if (selectedText && selectedText.length > 0) {
                    this.handleWordClick(selectedText, e);
                } else {
                    // Try to get word at cursor
                    const word = this.getWordAtCursor(e);
                    console.log('BhashaZap: Word at cursor:', word);
                    if (word && word.length > 1) {
                        this.handleWordClick(word, e);
                    }
                }
            }
        });

        // Listen for settings changes
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('BhashaZap: Received message:', request);
            if (request.action === 'settingsChanged') {
                const changes = request.changes;
                if (changes.isExtensionActive) {
                    this.isActive = changes.isExtensionActive.newValue;
                }
                if (changes.selectedLanguages) {
                    const indianLanguages = changes.selectedLanguages.newValue || [];
                    this.selectedLanguages = ['english'].concat(indianLanguages);
                }
                if (changes.popupDuration) {
                    this.popupDuration = changes.popupDuration.newValue;
                }
                sendResponse({success: true});
            }
        });

        // ESC key to close popup
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup && this.popup.style.display === 'block') {
                this.hidePopup();
            }
        });

        console.log('BhashaZap: Event listeners added');
    }

    getSelectedText() {
        return window.getSelection().toString().trim();
    }

    getWordAtCursor(e) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return null;

        const text = range.startContainer.textContent;
        const offset = range.startOffset;
        let start = offset, end = offset;

        while (start > 0 && /\w/.test(text[start - 1])) start--;
        while (end < text.length && /\w/.test(text[end])) end++;

        return text.substring(start, end).trim();
    }

    async handleWordClick(word, event) {
        console.log('BhashaZap: Handling word:', word);
        
        if (!word || word.length < 2) return;

        // Show popup immediately
        this.showPopup();
        
        // Set word in header
        const wordElement = document.getElementById('bhashazap-word');
        if (wordElement) {
            wordElement.textContent = word;
        }

        // Load fresh settings then fetch definitions
        await this.loadFreshSettings();
        await this.fetchDefinitions(word.toLowerCase().replace(/[^\w\s]/g, ''));
    }

    async fetchDefinitions(word) {
        console.log('BhashaZap: Fetching definitions for:', word);
        
        const contentElement = document.getElementById('bhashazap-content');
        if (contentElement) {
            contentElement.innerHTML = '<div class="bhashazap-loading">Fetching definitions...</div>';
        }

        const promises = [];

        // Fetch definitions for each language
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
            console.error('BhashaZap: Error fetching definitions:', error);
            this.showError('Failed to fetch definitions. Please try again.');
        }
    }

    async fetchEnglishDefinition(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error('Definition not found');
            const data = await response.json();
            return { type: 'english', data: data[0] };
        } catch (error) {
            throw new Error(`English definition: ${error.message}`);
        }
    }

    async fetchIndianLanguageDefinition(word, language) {
        try {
            // Try to get translated definition
            const definition = await this.getTranslatedDefinition(word, language);
            return {
                type: 'indian_language',
                language: language,
                data: definition
            };
        } catch (error) {
            throw new Error(`${language} definition: ${error.message}`);
        }
    }

    async getTranslatedDefinition(word, language) {
        try {
            console.log(`BhashaZap: Getting translated definition for ${word} in ${language}`);
            
            // Get English definition first
            const englishDef = await this.fetchEnglishDefinition(word);
            if (!englishDef?.data?.meanings?.[0]?.definitions?.[0]) {
                console.log('BhashaZap: No English definition found for translation');
                return null;
            }

            const definitionText = englishDef.data.meanings[0].definitions[0].definition;
            const langCode = this.getLanguageCode(language);
            
            console.log(`BhashaZap: Translating: "${definitionText}" to ${langCode}`);
            
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(definitionText)}&langpair=en|${langCode}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.responseData?.translatedText) {
                    console.log(`BhashaZap: Translation result: "${data.responseData.translatedText}"`);
                    return {
                        definition: data.responseData.translatedText
                    };
                }
            }
        } catch (error) {
            console.warn('BhashaZap: Translation failed:', error);
        }
        return null;
    }

    getLanguageCode(language) {
        const codes = {
            'kannada': 'kn', 'telugu': 'te', 'hindi': 'hi', 'tamil': 'ta',
            'malayalam': 'ml', 'bengali': 'bn', 'gujarati': 'gu', 'marathi': 'mr'
        };
        return codes[language] || 'en';
    }

    displayResults(results, word) {
        let content = '';
        let hasContent = false;
        let englishResult = null;
        let indianResults = [];

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { type, data, language } = result.value;
                if (type === 'english' && data) {
                    englishResult = { data };
                    hasContent = true;
                } else if (type === 'indian_language' && data) {
                    indianResults.push({ data, language });
                    hasContent = true;
                }
            }
        });

        // Display Indian languages first
        indianResults.forEach(result => {
            content += this.formatIndianLanguageDefinition(result.data, result.language);
        });

        // Display English last
        if (englishResult) {
            content += this.formatEnglishDefinition(englishResult.data);
        }

        if (!hasContent) {
            content = `<div class="bhashazap-no-definition">No definitions found for "${word}". Try checking the spelling.</div>`;
        }

        const contentElement = document.getElementById('bhashazap-content');
        if (contentElement) {
            contentElement.innerHTML = content;
        }

        this.startAutoCloseTimer();
    }

    formatEnglishDefinition(data) {
        let html = '<div class="bhashazap-section"><div class="bhashazap-lang-header">English</div>';
        
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

        return html + '</div>';
    }

    formatIndianLanguageDefinition(data, language) {
        const langName = this.getLanguageDisplayName(language);
        let html = `<div class="bhashazap-section"><div class="bhashazap-lang-header">${langName}</div>`;
        
        html += `<div class="bhashazap-definition">${data.definition}</div>`;
        
        if (data.note) {
            html += `<div class="bhashazap-translation-note">📝 ${data.note}</div>`;
        }
        
        return html + '</div>';
    }

    getLanguageDisplayName(language) {
        const names = {
            'english': 'English', 'hindi': 'हिंदी (Hindi)', 'kannada': 'ಕನ್ನಡ (Kannada)',
            'telugu': 'తెలుగు (Telugu)', 'tamil': 'தமிழ் (Tamil)', 'malayalam': 'മലയാളം (Malayalam)',
            'bengali': 'বাংলা (Bengali)', 'gujarati': 'ગુજરાતી (Gujarati)', 'marathi': 'मराठी (Marathi)'
        };
        return names[language] || language.toUpperCase();
    }

    startAutoCloseTimer() {
        this.stopAutoCloseTimer();
        
        if (this.popupDuration > 0) {
            this.currentTimer = 0;
            const timerContainer = document.getElementById('bhashazap-timer-container');
            const timerText = document.getElementById('bhashazap-timer-text');
            const progressFill = document.getElementById('bhashazap-progress-fill');
            
            if (timerContainer) timerContainer.style.display = 'block';
            
            this.timerInterval = setInterval(() => {
                this.currentTimer++;
                const remaining = this.popupDuration - this.currentTimer;
                const progress = (this.currentTimer / this.popupDuration) * 100;
                
                if (timerText) {
                    timerText.textContent = `Auto-close in ${remaining} seconds (${this.currentTimer}/${this.popupDuration})`;
                }
                if (progressFill) {
                    progressFill.style.width = `${100 - progress}%`;
                }
                
                if (this.currentTimer >= this.popupDuration) {
                    this.hidePopup();
                }
            }, 1000);
        }
    }

    stopAutoCloseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        const timerContainer = document.getElementById('bhashazap-timer-container');
        if (timerContainer) timerContainer.style.display = 'none';
    }

    showPopup() {
        console.log('BhashaZap: Showing popup');
        if (this.popup) {
            this.popup.style.display = 'block';
        }
    }

    hidePopup() {
        console.log('BhashaZap: Hiding popup');
        this.stopAutoCloseTimer();
        if (this.popup) {
            this.popup.style.display = 'none';
        }
    }

    showError(message) {
        const contentElement = document.getElementById('bhashazap-content');
        if (contentElement) {
            contentElement.innerHTML = `<div class="bhashazap-error">${message}</div>`;
        }
        this.startAutoCloseTimer();
    }

    loadSettings() {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (response?.success) {
                this.isActive = response.isExtensionActive !== false;
                const indianLanguages = response.selectedLanguages || [];
                this.selectedLanguages = ['english'].concat(indianLanguages);
                this.popupDuration = response.popupDuration || 15;
                console.log('BhashaZap: Settings loaded:', this.selectedLanguages, this.popupDuration);
            }
        });
    }

    async loadFreshSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
                if (response?.success) {
                    this.isActive = response.isExtensionActive !== false;
                    const indianLanguages = response.selectedLanguages || [];
                    this.selectedLanguages = ['english'].concat(indianLanguages);
                    this.popupDuration = response.popupDuration || 15;
                    console.log('BhashaZap: Fresh settings loaded:', this.selectedLanguages);
                }
                resolve();
            });
        });
    }
}

// Initialize
let bhashaZap;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bhashaZap = new BhashaZap();
    });
} else {
    bhashaZap = new BhashaZap();
}

console.log('BhashaZap: Script loaded successfully');