// BhashaZap Extension - Complete Content Script
// Version 2.0.0 - Working Implementation
console.log('BhashaZap: Complete version loading...');

class BhashaZapComplete {
    constructor() {
        this.isActive = true;
        this.selectedLanguages = ['kannada', 'marathi', 'english'];
        this.popupDuration = 15;
        this.timerInterval = null;
        this.currentTimer = 0;
        this.popup = null;
        this.init();
    }

    init() {
        console.log('BhashaZap: Initializing complete version...');
        this.createStyles();
        this.createPopup();
        this.addEventListeners();
        this.loadSettings();
        console.log('BhashaZap: Complete initialization finished');
    }

    createStyles() {
        // Remove existing styles
        const existingStyle = document.getElementById('bhashazap-complete-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'bhashazap-complete-styles';
        style.textContent = `
            #bhashazap-complete-popup {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 6px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                width: 320px;
                max-height: 350px;
                overflow: hidden;
                animation: bhashazap-slideIn 0.2s ease-out;
            }

            @keyframes bhashazap-slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            .bhashazap-complete-header {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                color: white;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }

            .bhashazap-complete-word {
                font-size: 15px;
                font-weight: bold;
                text-transform: capitalize;
                flex: 1;
            }

            .bhashazap-complete-version {
                font-size: 9px;
                color: rgba(255,255,255,0.7);
                margin-right: 8px;
                background: rgba(255,255,255,0.1);
                padding: 1px 4px;
                border-radius: 6px;
            }

            .bhashazap-complete-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .bhashazap-complete-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .bhashazap-complete-timer {
                background: rgba(255,255,255,0.05);
                padding: 4px 12px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: none;
            }

            .bhashazap-complete-timer-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 3px;
            }

            .bhashazap-complete-timer-count {
                color: #4ade80;
                font-size: 11px;
                font-weight: bold;
            }

            .bhashazap-complete-timer-text {
                color: white;
                font-size: 9px;
                font-weight: 500;
            }

            .bhashazap-complete-progress-bar {
                width: 100%;
                height: 2px;
                background: rgba(255,255,255,0.2);
                border-radius: 1px;
                overflow: hidden;
            }

            .bhashazap-complete-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
                width: 100%;
                border-radius: 1px;
                transition: width 0.9s ease-out;
            }

            .bhashazap-complete-content {
                background: white;
                max-height: 250px;
                overflow-y: auto;
                padding: 0;
            }

            .bhashazap-complete-loading {
                padding: 12px;
                text-align: center;
                color: #666;
                font-style: italic;
                font-size: 12px;
            }

            .bhashazap-complete-section {
                padding: 6px 12px;
                border-bottom: 1px solid #f0f0f0;
            }

            .bhashazap-complete-section:last-child {
                border-bottom: none;
            }

            .bhashazap-complete-lang-header {
                font-weight: bold;
                color: #667eea;
                font-size: 11px;
                margin-bottom: 4px;
                letter-spacing: 0.3px;
            }

            .bhashazap-complete-definition {
                color: #333;
                line-height: 1.3;
                margin-bottom: 2px;
                font-size: 12px;
            }

            .bhashazap-complete-phonetic {
                color: #666;
                font-style: italic;
                font-size: 10px;
                margin-bottom: 3px;
            }

            .bhashazap-complete-part-speech {
                background: #f0f4ff;
                color: #667eea;
                padding: 1px 4px;
                border-radius: 6px;
                font-size: 9px;
                font-weight: bold;
                text-transform: uppercase;
                display: inline-block;
                margin-bottom: 3px;
                margin-right: 3px;
            }

            .bhashazap-complete-example {
                background: #f8f9fa;
                border-left: 2px solid #667eea;
                padding: 3px 6px;
                margin: 3px 0;
                font-style: italic;
                color: #555;
                border-radius: 0 2px 2px 0;
                font-size: 11px;
            }

            .bhashazap-complete-error {
                color: #dc3545;
                text-align: center;
                padding: 12px;
                font-style: italic;
                font-size: 12px;
            }

            .bhashazap-complete-no-definition {
                color: #6c757d;
                text-align: center;
                padding: 8px;
                font-style: italic;
                background: #f8f9fa;
                font-size: 12px;
            }

            /* Scrollbar styling */
            .bhashazap-complete-content::-webkit-scrollbar {
                width: 4px;
            }

            .bhashazap-complete-content::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .bhashazap-complete-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 2px;
            }

            .bhashazap-complete-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        
        document.head.appendChild(style);
        console.log('BhashaZap: Styles added');
    }

    createPopup() {
        // Remove existing popup
        const existing = document.getElementById('bhashazap-complete-popup');
        if (existing) {
            existing.remove();
        }

        this.popup = document.createElement('div');
        this.popup.id = 'bhashazap-complete-popup';
        this.popup.innerHTML = `
            <div class="bhashazap-complete-header">
                <div class="bhashazap-complete-word" id="bhashazap-complete-word">Word</div>
                <div class="bhashazap-complete-version">BhashaZap 2.0.0</div>
                <button class="bhashazap-complete-close" id="bhashazap-complete-close">×</button>
            </div>
            <div class="bhashazap-complete-timer" id="bhashazap-complete-timer">
                <div class="bhashazap-complete-timer-info">
                    <div class="bhashazap-complete-timer-count" id="bhashazap-complete-timer-count">0</div>
                    <div class="bhashazap-complete-timer-text" id="bhashazap-complete-timer-text">Auto-close in 15s</div>
                </div>
                <div class="bhashazap-complete-progress-bar">
                    <div class="bhashazap-complete-progress-fill" id="bhashazap-complete-progress-fill"></div>
                </div>
            </div>
            <div class="bhashazap-complete-content" id="bhashazap-complete-content">
                <div class="bhashazap-complete-loading">Loading definitions...</div>
            </div>
        `;

        document.body.appendChild(this.popup);

        // Add close button event
        const closeBtn = document.getElementById('bhashazap-complete-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hidePopup();
            });
        }

        console.log('BhashaZap: Popup created');
    }

    addEventListeners() {
        console.log('BhashaZap: Adding event listeners...');

        // Double-click event
        document.addEventListener('dblclick', (e) => {
            console.log('BhashaZap: Double-click detected');
            if (!this.isActive) return;

            const selectedText = this.getSelectedText();
            let word = selectedText;

            if (!word) {
                word = this.getWordAtCursor(e);
            }

            if (word && word.length > 1) {
                console.log('BhashaZap: Processing word:', word);
                this.handleWordClick(word.toLowerCase().replace(/[^\w\s]/g, ''));
            }
        });

        // Settings messages
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('BhashaZap: Received message:', request);
                
                if (request.action === 'settingsChanged') {
                    const changes = request.changes;
                    if (changes.isExtensionActive) {
                        this.isActive = changes.isExtensionActive.newValue;
                    }
                    if (changes.selectedLanguages) {
                        this.selectedLanguages = ['english'].concat(changes.selectedLanguages.newValue || []);
                    }
                    if (changes.popupDuration) {
                        this.popupDuration = changes.popupDuration.newValue;
                    }
                    sendResponse({success: true});
                }
            });
        }

        // Keyboard events
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

    async handleWordClick(word) {
        console.log('BhashaZap: Handling word click:', word);
        
        this.showPopup();
        
        // Set word in header
        const wordElement = document.getElementById('bhashazap-complete-word');
        if (wordElement) {
            wordElement.textContent = word.charAt(0).toUpperCase() + word.slice(1);
        }

        // Reload settings to get latest language selection
        await this.reloadSettings();

        // Start timer
        this.startTimer();

        // Fetch definitions with updated language settings
        await this.fetchAllDefinitions(word);
    }

    async fetchAllDefinitions(word) {
        console.log('BhashaZap: Fetching all definitions for:', word);
        
        const contentElement = document.getElementById('bhashazap-complete-content');
        if (contentElement) {
            contentElement.innerHTML = '<div class="bhashazap-complete-loading">Fetching definitions...</div>';
        }

        let content = '';
        let hasContent = false;

        // Define languages with proper display names
        const languageMap = [
            { code: 'kannada', name: 'ಕನ್ನಡ (KANNADA)', apiCode: 'kn' },
            { code: 'marathi', name: 'मराठी (MARATHI)', apiCode: 'mr' },
            { code: 'english', name: 'ENGLISH', apiCode: 'en' }
        ];

        // Fetch for each language
        for (const lang of languageMap) {
            try {
                console.log(`BhashaZap: Fetching ${lang.code} definition...`);
                
                if (lang.code === 'english') {
                    const englishDef = await this.fetchEnglishDefinition(word);
                    if (englishDef) {
                        content += this.formatEnglishDefinition(englishDef, lang.name);
                        hasContent = true;
                        console.log('BhashaZap: English definition added');
                    } else {
                        content += this.formatNoDefinition(lang.name);
                    }
                } else {
                    const translatedDef = await this.fetchTranslatedDefinition(word, lang.apiCode);
                    if (translatedDef) {
                        content += this.formatTranslatedDefinition(translatedDef, lang.name);
                        hasContent = true;
                        console.log(`BhashaZap: ${lang.code} definition added`);
                    } else {
                        content += this.formatNoDefinition(lang.name);
                    }
                }
            } catch (error) {
                console.error(`BhashaZap: Error fetching ${lang.code}:`, error);
                content += this.formatNoDefinition(lang.name);
            }
        }

        if (!hasContent) {
            content = `<div class="bhashazap-complete-no-definition">No definitions found for "${word}". Please try another word.</div>`;
        }

        if (contentElement) {
            contentElement.innerHTML = content;
            console.log('BhashaZap: All definitions loaded');
        }
    }

    async fetchEnglishDefinition(word) {
        try {
            console.log(`BhashaZap: Calling English API for: ${word}`);
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (response.ok) {
                const data = await response.json();
                const entry = data[0];
                
                if (entry && entry.meanings && entry.meanings[0] && entry.meanings[0].definitions && entry.meanings[0].definitions[0]) {
                    const meaning = entry.meanings[0];
                    const definition = meaning.definitions[0];
                    
                    return {
                        word: entry.word,
                        phonetic: entry.phonetic,
                        partOfSpeech: meaning.partOfSpeech,
                        definition: definition.definition,
                        example: definition.example
                    };
                }
            } else {
                console.log('BhashaZap: English API response not OK:', response.status);
            }
        } catch (error) {
            console.error('BhashaZap: English API error:', error);
        }
        return null;
    }

    async fetchTranslatedDefinition(word, langCode) {
        try {
            console.log(`BhashaZap: Getting translated definition for ${word} in ${langCode}`);
            
            // First get English definition
            const englishDef = await this.fetchEnglishDefinition(word);
            if (!englishDef) {
                console.log('BhashaZap: No English definition to translate');
                return null;
            }

            // Translate the definition
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishDef.definition)}&langpair=en|${langCode}`,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'BhashaZap Extension'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log(`BhashaZap: Translation API response:`, data);
                
                if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                    return {
                        definition: data.responseData.translatedText,
                        originalDefinition: englishDef.definition
                    };
                } else {
                    console.log('BhashaZap: Translation API returned error status:', data.responseStatus);
                }
            } else {
                console.error('BhashaZap: Translation API response not OK:', response.status);
            }
        } catch (error) {
            console.error(`BhashaZap: Translation error for ${langCode}:`, error);
        }
        return null;
    }

    formatEnglishDefinition(data, languageName) {
        let html = `<div class="bhashazap-complete-section">
            <div class="bhashazap-complete-lang-header">${languageName}</div>`;
        
        if (data.phonetic) {
            html += `<div class="bhashazap-complete-phonetic">//${data.phonetic}//</div>`;
        }
        
        if (data.partOfSpeech) {
            html += `<div class="bhashazap-complete-part-speech">${data.partOfSpeech}</div>`;
        }
        
        html += `<div class="bhashazap-complete-definition">${data.definition}</div>`;
        
        if (data.example) {
            html += `<div class="bhashazap-complete-example">"${data.example}"</div>`;
        }
        
        html += `</div>`;
        return html;
    }

    formatTranslatedDefinition(data, languageName) {
        return `<div class="bhashazap-complete-section">
            <div class="bhashazap-complete-lang-header">${languageName}</div>
            <div class="bhashazap-complete-definition">${data.definition}</div>
        </div>`;
    }

    formatNoDefinition(languageName) {
        return `<div class="bhashazap-complete-section">
            <div class="bhashazap-complete-lang-header">${languageName}</div>
            <div class="bhashazap-complete-no-definition">Definition not available</div>
        </div>`;
    }

    startTimer() {
        this.stopTimer();
        
        if (this.popupDuration > 0) {
            this.currentTimer = 0;
            const timerElement = document.getElementById('bhashazap-complete-timer');
            const timerCount = document.getElementById('bhashazap-complete-timer-count');
            const timerText = document.getElementById('bhashazap-complete-timer-text');
            const progressFill = document.getElementById('bhashazap-complete-progress-fill');
            
            if (timerElement) {
                timerElement.style.display = 'block';
            }

            this.timerInterval = setInterval(() => {
                this.currentTimer++;
                const remaining = this.popupDuration - this.currentTimer;
                const progress = (this.currentTimer / this.popupDuration) * 100;
                
                if (timerCount) {
                    timerCount.textContent = this.currentTimer;
                }
                
                if (timerText) {
                    timerText.textContent = `Auto-close in ${remaining}s`;
                }
                
                if (progressFill) {
                    progressFill.style.width = `${100 - progress}%`;
                }
                
                if (this.currentTimer >= this.popupDuration) {
                    this.hidePopup();
                }
            }, 1000);

            console.log('BhashaZap: Timer started');
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const timerElement = document.getElementById('bhashazap-complete-timer');
        if (timerElement) {
            timerElement.style.display = 'none';
        }
    }

    showPopup() {
        console.log('BhashaZap: Showing popup');
        if (this.popup) {
            this.popup.style.display = 'block';
        }
    }

    hidePopup() {
        console.log('BhashaZap: Hiding popup');
        this.stopTimer();
        if (this.popup) {
            this.popup.style.display = 'none';
        }
    }

    loadSettings() {
        // Try to load from chrome storage if available
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.storage) {
            chrome.storage.sync.get(['selectedLanguages', 'isExtensionActive', 'popupDuration'], (result) => {
                if (chrome.runtime.lastError) {
                    console.log('BhashaZap: Using default settings due to error:', chrome.runtime.lastError);
                } else {
                    this.isActive = result.isExtensionActive !== false;
                    
                    if (result.selectedLanguages && result.selectedLanguages.length > 0) {
                        // Add English plus selected languages
                        this.selectedLanguages = ['english'].concat(result.selectedLanguages);
                    }
                    
                    if (result.popupDuration) {
                        this.popupDuration = result.popupDuration;
                    }
                    
                    console.log('BhashaZap: Settings loaded:', {
                        active: this.isActive,
                        languages: this.selectedLanguages,
                        duration: this.popupDuration
                    });
                }
            });
        } else {
            console.log('BhashaZap: Chrome APIs not available, using defaults');
        }
    }
}

// Initialize the extension
let bhashaZapComplete;

function initializeBhashaZap() {
    try {
        bhashaZapComplete = new BhashaZapComplete();
        console.log('BhashaZap: Successfully initialized');
    } catch (error) {
        console.error('BhashaZap: Initialization error:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBhashaZap);
} else {
    initializeBhashaZap();
}

// Export for debugging
window.BhashaZapComplete = BhashaZapComplete;

console.log('BhashaZap: Complete content script loaded successfully');