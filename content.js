// BhashaZap Extension - Fixed Content Script
// Version 2.0.1 - Fixed popup sizing and English layout
console.log('BhashaZap: Fixed version loading...');

class BhashaZapComplete {
    constructor() {
        this.isActive = true;
        this.selectedLanguages = []; // Will be loaded from popup settings
        this.popupDuration = 15; // Default, will be loaded from popup settings
        this.timerInterval = null;
        this.currentTimer = 0;
        this.popup = null;
        
        // Enhanced language mapping with proper display names and API codes
        this.languageMapping = {
            'hi': { name: 'हिन्दी (HINDI)', apiCode: 'hi' },
            'bn': { name: 'বাংলা (BENGALI)', apiCode: 'bn' },
            'te': { name: 'తెలుగు (TELUGU)', apiCode: 'te' },
            'mr': { name: 'मराठी (MARATHI)', apiCode: 'mr' },
            'ta': { name: 'தமிழ் (TAMIL)', apiCode: 'ta' },
            'ur': { name: 'اردو (URDU)', apiCode: 'ur' },
            'gu': { name: 'ગુજરાતી (GUJARATI)', apiCode: 'gu' },
            'kn': { name: 'ಕನ್ನಡ (KANNADA)', apiCode: 'kn' },
            'ml': { name: 'മലയാളം (MALAYALAM)', apiCode: 'ml' },
            'pa': { name: 'ਪੰਜਾਬੀ (PUNJABI)', apiCode: 'pa' },
            'as': { name: 'অসমীয়া (ASSAMESE)', apiCode: 'as' }, // Added Assamese
            'or': { name: 'ଓଡ଼ିଆ (ODIA)', apiCode: 'or' }, // Added Odia
            'english': { name: 'ENGLISH', apiCode: 'en' }
        };
        
        this.init();
    }

    init() {
        console.log('BhashaZap: Initializing fixed version...');
        this.createStyles();
        this.createPopup();
        this.addEventListeners();
        this.loadSettings();
        console.log('BhashaZap: Fixed initialization finished');
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
                border-radius: 8px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                width: 380px;
                min-height: 200px;
                max-height: 80vh;
                overflow: hidden;
                animation: bhashazap-slideIn 0.3s ease-out;
            }

            @keyframes bhashazap-slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            .bhashazap-complete-header {
                background: rgba(255,255,255,0.15);
                backdrop-filter: blur(15px);
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
                flex-shrink: 0;
            }

            .bhashazap-complete-word {
                font-size: 16px;
                font-weight: 700;
                text-transform: capitalize;
                flex: 1;
            }

            .bhashazap-complete-version {
                font-size: 10px;
                color: rgba(255,255,255,0.8);
                margin-right: 10px;
                background: rgba(255,255,255,0.15);
                padding: 2px 6px;
                border-radius: 8px;
                font-weight: 500;
            }

            .bhashazap-complete-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                width: 22px;
                height: 22px;
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
                background: rgba(255,255,255,0.1);
                padding: 8px 16px;
                border-bottom: 1px solid rgba(255,255,255,0.15);
                display: none;
                flex-shrink: 0;
            }

            .bhashazap-complete-timer-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
            }

            .bhashazap-complete-timer-count {
                color: #4ade80;
                font-size: 12px;
                font-weight: 700;
            }

            .bhashazap-complete-timer-text {
                color: white;
                font-size: 10px;
                font-weight: 500;
            }

            .bhashazap-complete-progress-bar {
                width: 100%;
                height: 3px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                overflow: hidden;
            }

            .bhashazap-complete-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
                width: 100%;
                border-radius: 2px;
                transition: width 0.9s ease-out;
            }

            .bhashazap-complete-content {
                background: white;
                max-height: calc(80vh - 120px);
                overflow-y: auto;
                padding: 0;
                flex: 1;
                min-height: 100px;
            }

            .bhashazap-complete-loading {
                padding: 20px;
                text-align: center;
                color: #666;
                font-style: italic;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .bhashazap-complete-loading::after {
                content: '';
                width: 16px;
                height: 16px;
                border: 2px solid #e5e7eb;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .bhashazap-complete-section {
                padding: 14px 16px;
                border-bottom: 1px solid #f0f0f0;
            }

            .bhashazap-complete-section:last-child {
                border-bottom: none;
                padding-bottom: 16px;
            }

            .bhashazap-complete-lang-header {
                font-weight: 700;
                color: #667eea;
                font-size: 12px;
                margin-bottom: 8px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .bhashazap-complete-definition {
                color: #333;
                line-height: 1.5;
                margin-bottom: 4px;
                font-size: 13px;
                word-wrap: break-word;
            }

            .bhashazap-complete-word-meanings {
                color: #059669;
                line-height: 1.5;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 600;
                word-wrap: break-word;
                padding: 6px 0;
            }

            .bhashazap-complete-word-meaning {
                color: #333;
                line-height: 1.5;
                margin-bottom: 8px;
                font-size: 13px;
                word-wrap: break-word;
                padding: 6px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                border-left: 3px solid #667eea;
            }

            .bhashazap-complete-phonetic {
                color: #666;
                font-style: italic;
                font-size: 11px;
                background: #f8f9fa;
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
            }

            .bhashazap-complete-part-speech {
                background: #f0f4ff;
                color: #667eea;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                display: inline-block;
            }

            .bhashazap-complete-example {
                background: #f8f9fa;
                border-left: 3px solid #667eea;
                padding: 6px 8px;
                margin: 6px 0 0 0;
                font-style: italic;
                color: #555;
                border-radius: 0 4px 4px 0;
                font-size: 12px;
                line-height: 1.4;
            }

            .bhashazap-complete-error {
                color: #dc3545;
                text-align: center;
                padding: 20px;
                font-style: italic;
                font-size: 13px;
            }

            .bhashazap-complete-no-definition {
                color: #6c757d;
                text-align: center;
                padding: 12px;
                font-style: italic;
                background: #f8f9fa;
                font-size: 12px;
            }

            .bhashazap-complete-no-languages {
                color: #dc3545;
                text-align: center;
                padding: 20px;
                font-size: 13px;
                line-height: 1.5;
            }

            .bhashazap-complete-no-languages strong {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
            }

            /* Enhanced English section styling */
            .bhashazap-complete-content .bhashazap-complete-section:last-child {
                background: #f0fdf4 !important;
                border-left: 4px solid #059669 !important;
            }

            .bhashazap-complete-content .bhashazap-complete-section:last-child .bhashazap-complete-lang-header {
                color: #059669 !important;
            }

            .bhashazap-complete-content .bhashazap-complete-section:last-child .bhashazap-complete-part-speech {
                background: #dcfce7 !important;
                color: #059669 !important;
            }

            .bhashazap-complete-content .bhashazap-complete-section:last-child .bhashazap-complete-phonetic {
                background: #dcfce7 !important;
                color: #059669 !important;
            }

            .bhashazap-complete-content .bhashazap-complete-section:last-child .bhashazap-complete-example {
                border-left-color: #059669 !important;
                background: #f0fdf4 !important;
            }

            /* Scrollbar styling */
            .bhashazap-complete-content::-webkit-scrollbar {
                width: 6px;
            }

            .bhashazap-complete-content::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .bhashazap-complete-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .bhashazap-complete-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            /* Responsive adjustments for smaller screens */
            @media (max-height: 600px) {
                #bhashazap-complete-popup {
                    max-height: 90vh;
                }
                
                .bhashazap-complete-content {
                    max-height: calc(90vh - 100px);
                }
            }
        `;
        
        document.head.appendChild(style);
        console.log('BhashaZap: Fixed styles added');
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
                <div class="bhashazap-complete-version">BhashaZap 2.0.1</div>
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

        console.log('BhashaZap: Fixed popup created');
    }

    addEventListeners() {
        console.log('BhashaZap: Adding event listeners...');

        // Double-click event
        document.addEventListener('dblclick', (e) => {
            console.log('BhashaZap: Double-click detected');
            if (!this.isActive) {
                console.log('BhashaZap: Extension is disabled');
                return;
            }

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

        // Settings messages from popup and background
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    console.log('BhashaZap: Received message:', request);
                    
                    try {
                        if (request.action === 'settingsChanged') {
                            this.handleSettingsChanged(request.changes);
                            sendResponse({success: true});
                        } else if (request.action === 'toggleExtension') {
                            this.isActive = request.isActive;
                            console.log('BhashaZap: Extension toggled to:', this.isActive);
                            sendResponse({success: true});
                        }
                    } catch (error) {
                        console.error('BhashaZap: Error handling message:', error);
                        sendResponse({success: false, error: error.message});
                    }
                });
            }
        } catch (error) {
            console.log('BhashaZap: Could not set up Chrome runtime listener:', error);
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup && this.popup.style.display === 'block') {
                this.hidePopup();
            }
        });

        console.log('BhashaZap: Event listeners added');
    }

    handleSettingsChanged(changes) {
        if (changes.isExtensionActive) {
            this.isActive = changes.isExtensionActive.newValue;
            console.log('BhashaZap: Extension active status changed to:', this.isActive);
        }
        
        if (changes.selectedLanguages) {
            // Don't automatically add English first - let reordering logic handle it
            const indianLanguages = changes.selectedLanguages.newValue || [];
            this.selectedLanguages = [...indianLanguages];
            
            // Add English if not already present (but don't put it first)
            if (!this.selectedLanguages.includes('english')) {
                this.selectedLanguages.push('english');
            }
            
            console.log('BhashaZap: Selected languages changed to:', this.selectedLanguages);
        }
        
        if (changes.popupDuration) {
            this.popupDuration = changes.popupDuration.newValue;
            console.log('BhashaZap: Popup duration changed to:', this.popupDuration);
        }
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
        
        // Show popup immediately for better UX
        this.showPopup();
        
        // Set word in header
        const wordElement = document.getElementById('bhashazap-complete-word');
        if (wordElement) {
            wordElement.textContent = word.charAt(0).toUpperCase() + word.slice(1);
        }

        // Show loading state
        const contentElement = document.getElementById('bhashazap-complete-content');
        if (contentElement) {
            contentElement.innerHTML = '<div class="bhashazap-complete-loading">Loading definitions...</div>';
        }

        // Start timer immediately
        this.startTimer();

        // Reload settings and fetch definitions in background
        try {
            await this.reloadSettings();
            
            // Check if extension is disabled
            if (!this.isActive) {
                console.log('BhashaZap: Extension is disabled');
                if (contentElement) {
                    contentElement.innerHTML = '<div class="bhashazap-complete-error">Extension is currently disabled. Enable it from the popup menu.</div>';
                }
                return;
            }
            
            // Check if any Indian languages are selected (English alone is not enough)
            const indianLanguages = this.selectedLanguages.filter(lang => lang !== 'english');
            if (indianLanguages.length === 0) {
                this.showNoLanguagesMessage();
                return;
            }

            // Fetch definitions
            await this.fetchAllDefinitions(word);
        } catch (error) {
            console.error('BhashaZap: Error in handleWordClick:', error);
            if (contentElement) {
                contentElement.innerHTML = '<div class="bhashazap-complete-error">Error loading definitions. Please try again.</div>';
            }
        }
    }

    showNoLanguagesMessage() {
        const contentElement = document.getElementById('bhashazap-complete-content');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="bhashazap-complete-no-languages">
                    <strong>No Indian languages selected!</strong>
                    Please click the BhashaZap extension icon and select up to 2 Indian languages from the popup to see translations.
                </div>
            `;
        }
    }

    async fetchAllDefinitions(word) {
        console.log('BhashaZap: Fetching definitions for languages:', this.selectedLanguages);
        
        const contentElement = document.getElementById('bhashazap-complete-content');

        let content = '';
        let hasContent = false;

        // FIXED: Explicit language reordering - Indian languages FIRST, English LAST
        const indianLanguages = [];
        let hasEnglish = false;
        
        // Separate Indian languages from English
        this.selectedLanguages.forEach(langCode => {
            if (langCode === 'english') {
                hasEnglish = true;
            } else {
                indianLanguages.push(langCode);
            }
        });
        
        // Create final order: Indian languages + English at end
        const finalOrder = [...indianLanguages];
        if (hasEnglish) {
            finalOrder.push('english');
        }

        console.log('BhashaZap: Original languages:', this.selectedLanguages);
        console.log('BhashaZap: Indian languages:', indianLanguages);
        console.log('BhashaZap: Final display order:', finalOrder);

        // Process each language in the correct order
        for (let i = 0; i < finalOrder.length; i++) {
            const langCode = finalOrder[i];
            try {
                const langInfo = this.languageMapping[langCode];
                if (!langInfo) {
                    console.warn('BhashaZap: Unknown language code:', langCode);
                    continue;
                }

                console.log(`BhashaZap: Processing ${langCode} (position ${i + 1}/${finalOrder.length})...`);
                
                let sectionContent = '';
                
                if (langCode === 'english') {
                    console.log('BhashaZap: Fetching ENGLISH definition (should be LAST)...');
                    const englishDef = await this.fetchEnglishDefinition(word);
                    if (englishDef) {
                        sectionContent = this.formatEnglishDefinition(englishDef, langInfo.name);
                        hasContent = true;
                        console.log('BhashaZap: English definition added at position:', i + 1);
                    } else {
                        sectionContent = this.formatNoDefinition(langInfo.name);
                    }
                } else {
                    console.log(`BhashaZap: Fetching ${langCode.toUpperCase()} definition (Indian language)...`);
                    const translatedDef = await this.fetchTranslatedDefinition(word, langInfo.apiCode);
                    if (translatedDef) {
                        console.log(`BhashaZap: ${langCode} translation data:`, translatedDef);
                        sectionContent = this.formatTranslatedDefinition(translatedDef, langInfo.name);
                        hasContent = true;
                        console.log(`BhashaZap: ${langCode} definition added at position:`, i + 1);
                    } else {
                        sectionContent = this.formatNoDefinition(langInfo.name);
                    }
                }
                
                // Add to content in the exact order we want
                content += sectionContent;
                
                // Update content progressively
                if (contentElement && i < finalOrder.length - 1) {
                    const remainingCount = finalOrder.length - i - 1;
                    contentElement.innerHTML = content + `<div class="bhashazap-complete-loading">Loading ${remainingCount} more language${remainingCount > 1 ? 's' : ''}...</div>`;
                }
                
            } catch (error) {
                console.error(`BhashaZap: Error fetching ${langCode}:`, error);
                const langInfo = this.languageMapping[langCode];
                if (langInfo) {
                    content += this.formatNoDefinition(langInfo.name);
                }
            }
        }

        if (!hasContent) {
            content = `<div class="bhashazap-complete-no-definition">No definitions found for "${word}". Please try another word.</div>`;
        }

        if (contentElement) {
            contentElement.innerHTML = content;
            console.log('BhashaZap: Final content order confirmed - Indian languages first, English last');
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
            <div class="bhashazap-complete-lang-header">
                ${languageName}`;
        
        // Add phonetic and part of speech in the same line as the header
        if (data.phonetic) {
            html += `<span class="bhashazap-complete-phonetic">/${data.phonetic}/</span>`;
        }
        
        if (data.partOfSpeech) {
            html += `<span class="bhashazap-complete-part-speech">${data.partOfSpeech}</span>`;
        }
        
        html += `</div>`;
        
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

            console.log(`BhashaZap: Timer started for ${this.popupDuration} seconds`);
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

    async reloadSettings() {
        return new Promise((resolve) => {
            try {
                // Check if Chrome extension APIs are available and context is valid
                if (typeof chrome !== 'undefined' && 
                    chrome.runtime && 
                    chrome.storage && 
                    chrome.runtime.id && 
                    !chrome.runtime.lastError) {
                    
                    // Add timeout to prevent hanging
                    const timeoutId = setTimeout(() => {
                        console.log('BhashaZap: Storage access timeout, using defaults');
                        this.setDefaultSettings();
                        resolve();
                    }, 2000);
                    
                    chrome.storage.sync.get(['selectedLanguages', 'isExtensionActive', 'popupDuration'], (result) => {
                        clearTimeout(timeoutId);
                        
                        if (chrome.runtime.lastError) {
                            console.log('BhashaZap: Storage error, using defaults:', chrome.runtime.lastError);
                            this.setDefaultSettings();
                            resolve();
                        } else {
                            this.isActive = result.isExtensionActive !== false;
                            
                            // Load Indian languages first, add English later (not first)
                            const indianLanguages = result.selectedLanguages || [];
                            this.selectedLanguages = [...indianLanguages];
                            
                            // Add English if not already present (but don't put it first)
                            if (!this.selectedLanguages.includes('english')) {
                                this.selectedLanguages.push('english');
                            }
                            
                            this.popupDuration = result.popupDuration || 15;
                            
                            console.log('BhashaZap: Settings successfully loaded:', {
                                active: this.isActive,
                                languages: this.selectedLanguages,
                                duration: this.popupDuration
                            });
                            resolve();
                        }
                    });
                } else {
                    console.log('BhashaZap: Chrome APIs unavailable or context invalidated, using defaults');
                    this.setDefaultSettings();
                    resolve();
                }
            } catch (error) {
                console.log('BhashaZap: Exception in reloadSettings, using defaults:', error);
                this.setDefaultSettings();
                resolve();
            }
        });
    }

    setDefaultSettings() {
        this.isActive = true;
        // Use the current popup selection if available, otherwise default
        if (!this.selectedLanguages || this.selectedLanguages.length === 0) {
            this.selectedLanguages = ['as', 'hi', 'english']; // Assamese, Hindi, English as shown in popup
        }
        this.popupDuration = 15;
        console.log('BhashaZap: Using default/fallback settings:', {
            active: this.isActive,
            languages: this.selectedLanguages,
            duration: this.popupDuration
        });
    }

    loadSettings() {
        // Initial settings load
        this.reloadSettings();
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

        console.log('BhashaZap: Fixed content script loaded successfully');

// Additional functionality for word meanings and definitions display
// This ensures proper separation of translations (meanings) and explanations (definitions)
// Word meanings appear in green, definitions in black for better user experience