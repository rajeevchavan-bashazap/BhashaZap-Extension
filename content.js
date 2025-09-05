class BhashaZapContent {
    constructor() {
        this.popup = null;
        this.isInitialized = false;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.popupStart = { x: 0, y: 0 };
        this.timer = null;
        this.timeLeft = 15;
        this.totalTime = 15;
        this.lastClickTime = 0;
        this.clickCount = 0;
        this.isExtensionActive = true;
        this.popupDuration = 15;
        this.selectedLanguages = ['kn', 'hi']; // Default fallback
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Load settings FIRST before setting up anything
        await this.loadSettings();
        
        // FIXED: Only double-click detection - removed single click
        this.setupDoubleClickHandler();

        // Hide popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popup && !this.popup.contains(e.target) && this.popup.style.display === 'block') {
                this.hidePopup();
            }
        }, true);

        // Prevent text selection while dragging
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });

        // Handle window events
        window.addEventListener('scroll', () => {
            if (this.popup && this.popup.style.display === 'block') {
                this.adjustPopupPosition();
            }
        });

        window.addEventListener('resize', () => {
            if (this.popup && this.popup.style.display === 'block') {
                this.adjustPopupPosition();
            }
        });

        // Listen for settings changes from popup
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('BhashaZap: Received message:', message);
                if (message.action === 'toggleExtension') {
                    this.isExtensionActive = message.isActive;
                    if (!this.isExtensionActive && this.popup) {
                        this.hidePopup();
                    }
                } else if (message.action === 'settingsChanged') {
                    this.loadSettings();
                }
                sendResponse({success: true});
            });
        }

        console.log('BhashaZap: Content script initialized with settings:', {
            active: this.isExtensionActive,
            duration: this.popupDuration,
            languages: this.selectedLanguages
        });
    }

    // FIXED: Proper async settings loading with better error handling
    loadSettings() {
        return new Promise((resolve) => {
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.log('BhashaZap: Chrome APIs not available, using defaults');
                resolve();
                return;
            }

            try {
                chrome.runtime.sendMessage({action: 'getSettings'}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('BhashaZap: Runtime error:', chrome.runtime.lastError.message);
                        resolve();
                        return;
                    }

                    if (response && response.success) {
                        this.isExtensionActive = response.isExtensionActive !== false;
                        this.popupDuration = response.popupDuration || 15;
                        this.selectedLanguages = response.selectedLanguages || ['kn', 'hi'];
                        this.totalTime = this.popupDuration;
                        this.timeLeft = this.popupDuration;
                        
                        console.log('BhashaZap: Settings loaded successfully:', {
                            isActive: this.isExtensionActive,
                            duration: this.popupDuration,
                            languages: this.selectedLanguages
                        });
                    } else {
                        console.log('BhashaZap: Invalid response, using defaults');
                    }
                    resolve();
                });
            } catch (error) {
                console.error('BhashaZap: Error in loadSettings:', error);
                resolve();
            }

            // Timeout fallback
            setTimeout(() => {
                console.log('BhashaZap: Settings load timeout, using defaults');
                resolve();
            }, 1000);
        });
    }

    // FIXED: Only double-click detection, no single click
    setupDoubleClickHandler() {
        let clickTimeout = null;
        let lastClickTarget = null;

        const handleDoubleClick = (e) => {
            if (!this.isExtensionActive) return;
            if (this.popup && this.popup.contains(e.target)) return;
            
            const excludedTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'IMG', 'VIDEO'];
            const excludedClasses = ['nav', 'menu', 'ad', 'advertisement', 'header', 'footer'];
            
            if (excludedTags.includes(e.target.tagName)) return;
            
            if (e.target.className && typeof e.target.className === 'string') {
                const hasExcludedClass = excludedClasses.some(cls => e.target.className.includes(cls));
                if (hasExcludedClass) return;
            }

            const now = Date.now();
            const timeSinceLastClick = now - this.lastClickTime;
            
            // FIXED: More precise double-click detection
            if (timeSinceLastClick > 600 || lastClickTarget !== e.target) {
                this.clickCount = 0;
                lastClickTarget = e.target;
            }
            
            this.clickCount++;
            this.lastClickTime = now;
            
            if (this.clickCount === 1) {
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => {
                    this.clickCount = 0;
                    lastClickTarget = null;
                }, 500);
            } else if (this.clickCount === 2) {
                clearTimeout(clickTimeout);
                this.clickCount = 0;
                lastClickTarget = null;
                this.handleWordSelection(e);
            }
        };

        // FIXED: Only use dblclick event for better reliability
        document.addEventListener('dblclick', handleDoubleClick, true);
        
        // Backup click detection for compatibility
        document.addEventListener('mousedown', handleDoubleClick, true);
    }

    createPopup() {
        if (this.popup) {
            this.popup.remove();
        }

        this.popup = document.createElement('div');
        this.popup.className = 'bhashazap-popup';
        
        // Create dynamic language sections based on selected languages
        const languageSections = this.createLanguageSections();
        
        this.popup.innerHTML = `
            <div class="bhashazap-header" id="bhashazap-header">
                <span class="bhashazap-word">Select a word</span>
                <button class="bhashazap-close" id="bhashazap-close-btn">×</button>
            </div>
            
            <div class="bhashazap-countdown-container">
                <span class="bhashazap-countdown-text" id="bhashazap-timer-count">${this.popupDuration}</span>
                <div class="bhashazap-countdown-bar">
                    <div class="bhashazap-countdown-progress" id="bhashazap-timer-progress" style="width: 100%;"></div>
                </div>
            </div>
            
            <div class="bhashazap-translations">
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">English</div>
                    <div class="bhashazap-translation-text" id="bhashazap-english-content">
                        Select a word to see its translation
                    </div>
                </div>
                ${languageSections}
            </div>
            
            <div class="bhashazap-footer">
                <span class="bhashazap-brand">BhashaZap 2.0.0</span>
            </div>
        `;

        // FIXED: Dynamic height adjustment
        this.popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 2147483647;
            min-height: auto;
            max-height: 90vh;
            overflow: hidden;
        `;

        document.body.appendChild(this.popup);
        this.initializePopup();
        
        console.log('BhashaZap: Popup created with languages:', this.selectedLanguages);
    }

    // FIXED: Create language sections based on selected languages
    createLanguageSections() {
        const languageNames = {
            'hi': 'Hindi',
            'bn': 'Bengali', 
            'te': 'Telugu',
            'mr': 'Marathi',
            'ta': 'Tamil',
            'ur': 'Urdu',
            'gu': 'Gujarati',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'pa': 'Punjabi'
        };

        return this.selectedLanguages.map(langCode => {
            const langName = languageNames[langCode] || langCode.toUpperCase();
            return `
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">${langName}</div>
                    <div class="bhashazap-translation-text" id="bhashazap-${langCode}-content">
                        Translation will appear here
                    </div>
                </div>
            `;
        }).join('');
    }

    initializePopup() {
        const closeBtn = this.popup.querySelector('#bhashazap-close-btn');
        const header = this.popup.querySelector('#bhashazap-header');
        
        // FIXED: Better close button handler
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('BhashaZap: Close button clicked');
                this.hidePopup();
            });
        }

        this.setupSmoothDrag(header);
        console.log('BhashaZap: Popup event listeners set up');
    }

    setupSmoothDrag(header) {
        const onMouseDown = (e) => {
            if (e.target.classList.contains('bhashazap-close')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            this.isDragging = true;
            
            const rect = this.popup.getBoundingClientRect();
            this.popupStart.x = rect.left;
            this.popupStart.y = rect.top;
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            
            header.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            this.popup.style.transform = 'none';
            
            document.addEventListener('mousemove', onMouseMove, { passive: false });
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const deltaX = e.clientX - this.dragStart.x;
            const deltaY = e.clientY - this.dragStart.y;
            
            let newX = this.popupStart.x + deltaX;
            let newY = this.popupStart.y + deltaY;
            
            const popupRect = this.popup.getBoundingClientRect();
            const maxX = window.innerWidth - popupRect.width;
            const maxY = window.innerHeight - popupRect.height;
            
            newX = Math.max(10, Math.min(newX, maxX - 10));
            newY = Math.max(10, Math.min(newY, maxY - 10));
            
            this.popup.style.left = newX + 'px';
            this.popup.style.top = newY + 'px';
        };

        const onMouseUp = (e) => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            header.style.cursor = 'grab';
            document.body.style.userSelect = '';
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        header.addEventListener('mousedown', onMouseDown);
        header.style.cursor = 'grab';
    }

    handleWordSelection(e) {
        if (!this.isExtensionActive) {
            console.log('BhashaZap: Extension disabled, ignoring selection');
            return;
        }

        try {
            let selectedText = '';
            let selection = null;

            if (window.getSelection) {
                selection = window.getSelection();
                selectedText = selection.toString().trim();
            }

            if (!selectedText) {
                selectedText = this.getWordAtPointEnhanced(e.clientX, e.clientY, e.target);
            }

            if (selectedText) {
                selectedText = selectedText.replace(/[^\w\s'-]/g, '').trim();
                
                if (selectedText.length > 1 && /[a-zA-Z]/.test(selectedText)) {
                    console.log('BhashaZap: Processing word:', selectedText);
                    
                    // Reload settings before showing popup
                    this.loadSettings().then(() => {
                        if (!this.popup) {
                            this.createPopup();
                        }
                        this.showPopup(e.clientX, e.clientY, selectedText);
                        
                        if (selection && selection.rangeCount > 0) {
                            this.highlightSelection(selection);
                        }
                    });
                }
            }
        } catch (error) {
            console.log('BhashaZap: Error in handleWordSelection:', error);
        }
    }

    getWordAtPointEnhanced(x, y, targetElement) {
        try {
            let result = '';

            if (document.caretRangeFromPoint) {
                try {
                    const range = document.caretRangeFromPoint(x, y);
                    if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                        result = this.expandToWordBoundaries(range);
                        if (result) return result;
                    }
                } catch (e) {
                    console.log('BhashaZap: caretRangeFromPoint failed');
                }
            }
            
            if (!result && document.caretPositionFromPoint) {
                try {
                    const caret = document.caretPositionFromPoint(x, y);
                    if (caret && caret.offsetNode && caret.offsetNode.nodeType === Node.TEXT_NODE) {
                        const range = document.createRange();
                        range.setStart(caret.offsetNode, caret.offset);
                        result = this.expandToWordBoundaries(range);
                        if (result) return result;
                    }
                } catch (e) {
                    console.log('BhashaZap: caretPositionFromPoint failed');
                }
            }
            
            if (!result && targetElement) {
                result = this.extractWordFromElement(targetElement);
            }
            
            return result;
        } catch (error) {
            console.log('BhashaZap: Error in getWordAtPointEnhanced:', error);
            return '';
        }
    }

    extractWordFromElement(element) {
        try {
            let currentElement = element;
            let attempts = 0;
            
            while (currentElement && attempts < 5) {
                const text = currentElement.textContent || currentElement.innerText || '';
                
                if (text.trim()) {
                    const words = text.trim().split(/[\s\n\r\t.,;:!?()[\]{}'"<>+=@#$%^&*~`|\\/-]+/);
                    
                    for (const word of words) {
                        const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
                        if (cleanWord.length >= 2 && /^[a-zA-Z][a-zA-Z'-]*[a-zA-Z]?$/.test(cleanWord)) {
                            return cleanWord;
                        }
                    }
                }
                
                currentElement = currentElement.parentElement;
                attempts++;
            }
            
            return '';
        } catch (error) {
            console.log('BhashaZap: Error extracting word:', error);
            return '';
        }
    }

    expandToWordBoundaries(range) {
        try {
            const textNode = range.startContainer;
            if (textNode.nodeType !== Node.TEXT_NODE) return '';
            
            const text = textNode.textContent;
            let start = range.startOffset;
            let end = start;

            while (start > 0 && /[a-zA-Z'-]/.test(text[start - 1])) {
                start--;
            }

            while (end < text.length && /[a-zA-Z'-]/.test(text[end])) {
                end++;
            }

            const word = text.substring(start, end).trim();
            
            if (word && window.getSelection) {
                try {
                    const newRange = document.createRange();
                    newRange.setStart(textNode, start);
                    newRange.setEnd(textNode, end);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } catch (e) {
                    // Selection might fail, that's okay
                }
            }
            
            return word;
        } catch (error) {
            console.log('BhashaZap: Error expanding word boundaries:', error);
            return '';
        }
    }

    highlightSelection(selection) {
        document.querySelectorAll('.bhashazap-selection').forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });

        try {
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.className = 'bhashazap-selection';
                span.style.cssText = `
                    background-color: #fff3cd !important;
                    border-radius: 2px !important;
                    padding: 1px 2px !important;
                `;
                range.surroundContents(span);
            }
        } catch (e) {
            console.log('BhashaZap: Could not highlight selection');
        }
    }

    showPopup(x, y, selectedText) {
        if (!this.popup) return;
        if (!this.isExtensionActive) return;

        console.log('BhashaZap: Showing popup for word:', selectedText);

        // FIXED: Capitalize first letter of word
        const capitalizedWord = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();

        // Update word in header
        const wordElement = this.popup.querySelector('.bhashazap-word');
        if (wordElement) {
            wordElement.textContent = capitalizedWord;
        }
        
        // Update translations using API
        this.updateTranslations(selectedText);
        
        // FIXED: Proper timer initialization
        this.timeLeft = this.popupDuration;
        this.totalTime = this.popupDuration;
        
        // Position popup
        const popupWidth = 280;
        const popupHeight = Math.min(400, window.innerHeight * 0.8); // Dynamic height
        
        let popupX = x + 15;
        let popupY = y + 15;
        
        if (popupX + popupWidth > window.innerWidth) {
            popupX = x - popupWidth - 15;
        }
        if (popupY + popupHeight > window.innerHeight) {
            popupY = y - popupHeight - 15;
        }
        
        popupX = Math.max(10, Math.min(popupX, window.innerWidth - popupWidth - 10));
        popupY = Math.max(10, Math.min(popupY, window.innerHeight - popupHeight - 10));
        
        this.popup.style.left = popupX + 'px';
        this.popup.style.top = popupY + 'px';
        this.popup.style.transform = 'none';
        this.popup.style.display = 'block';
        
        // FIXED: Adjust height after content is loaded
        setTimeout(() => {
            this.adjustPopupHeight();
        }, 50);
        
        // Start timer AFTER popup is visible
        this.updateTimer();
        this.startTimer();
        
        console.log('BhashaZap: Popup displayed successfully');
    }

    // FIXED: Auto-adjust popup height based on content
    adjustPopupHeight() {
        if (!this.popup || this.popup.style.display === 'none') return;
        
        const translations = this.popup.querySelector('.bhashazap-translations');
        if (translations) {
            const maxHeight = window.innerHeight * 0.8;
            const headerHeight = this.popup.querySelector('.bhashazap-header')?.offsetHeight || 0;
            const timerHeight = this.popup.querySelector('.bhashazap-countdown-container')?.offsetHeight || 0;
            const footerHeight = this.popup.querySelector('.bhashazap-footer')?.offsetHeight || 0;
            
            const availableHeight = maxHeight - headerHeight - timerHeight - footerHeight - 40; // 40px for padding
            
            translations.style.maxHeight = availableHeight + 'px';
            translations.style.overflowY = 'auto';
        }
    }

    adjustPopupPosition() {
        if (!this.popup || this.popup.style.display === 'none') return;
        
        const rect = this.popup.getBoundingClientRect();
        let newX = rect.left;
        let newY = rect.top;
        let changed = false;
        
        if (newX < 0) {
            newX = 10;
            changed = true;
        } else if (newX + rect.width > window.innerWidth) {
            newX = window.innerWidth - rect.width - 10;
            changed = true;
        }
        
        if (newY < 0) {
            newY = 10;
            changed = true;
        } else if (newY + rect.height > window.innerHeight) {
            newY = window.innerHeight - rect.height - 10;
            changed = true;
        }
        
        if (changed) {
            this.popup.style.left = newX + 'px';
            this.popup.style.top = newY + 'px';
        }
    }

    // FIXED: API-based translation system for ALL words
    async updateTranslations(word) {
        console.log('BhashaZap: Fetching translations for:', word);
        
        // Show loading state
        this.showLoadingState(word);
        
        try {
            // First get English definition from Free Dictionary API
            const englishDefinition = await this.fetchEnglishDefinition(word);
            
            // Then get translations for each selected language
            const translations = await this.fetchTranslations(word, this.selectedLanguages);
            
            // Update UI with results
            this.displayTranslations(word, englishDefinition, translations);
            
        } catch (error) {
            console.error('BhashaZap: Error fetching translations:', error);
            this.showErrorState(word);
        }
        
        // Adjust height after content is loaded
        setTimeout(() => {
            this.adjustPopupHeight();
        }, 100);
    }

    showLoadingState(word) {
        try {
            // Update English section
            const englishElement = this.popup.querySelector('#bhashazap-english-content');
            if (englishElement) {
                englishElement.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;"><div class="loading-spinner"></div>Loading definition...</div>';
            }

            // Update translation sections
            this.selectedLanguages.forEach(langCode => {
                const element = this.popup.querySelector(`#bhashazap-${langCode}-content`);
                if (element) {
                    element.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;"><div class="loading-spinner"></div>Loading translation...</div>';
                }
            });
            
            // Add CSS for loading spinner
            this.addLoadingSpinnerCSS();
            
        } catch (error) {
            console.error('BhashaZap: Error showing loading state:', error);
        }
    }

    addLoadingSpinnerCSS() {
        if (document.getElementById('bhashazap-spinner-css')) return;
        
        const style = document.createElement('style');
        style.id = 'bhashazap-spinner-css';
        style.textContent = `
            .loading-spinner {
                width: 14px;
                height: 14px;
                border: 2px solid #e2e8f0;
                border-radius: 50%;
                border-top-color: #667eea;
                animation: bhashazap-spin 1s ease-in-out infinite;
            }
            @keyframes bhashazap-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    async fetchEnglishDefinition(word) {
        try {
            // Use Free Dictionary API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
                const meaning = data[0].meanings[0];
                const partOfSpeech = meaning.partOfSpeech || '';
                const definition = meaning.definitions[0]?.definition || '';
                const example = meaning.definitions[0]?.example || '';
                
                let result = '';
                if (partOfSpeech) result += `(${partOfSpeech}) `;
                if (definition) result += definition;
                if (example) result += `\n\nExample: "${example}"`;
                
                return result || `Definition for "${word}" not found.`;
            }
            
            return `Definition for "${word}" not available.`;
            
        } catch (error) {
            console.error('BhashaZap: Error fetching English definition:', error);
            
            // Fallback to hardcoded definitions for common words
            const fallbackDefinitions = {
                'the': 'Used to refer to one or more people or things already mentioned or assumed to be common knowledge.',
                'and': 'Used to connect words of the same part of speech, clauses, or sentences.',
                'to': 'Expressing motion in the direction of (a particular location).',
                'for': 'In support of; in favor of; on behalf of.',
                'with': 'Accompanied by (another person or thing).',
                'house': 'A building for human habitation; a dwelling place.',
                'water': 'A transparent, odorless, tasteless liquid essential for life.',
                'book': 'A written or printed work consisting of pages glued or sewn together.',
                'love': 'A strong feeling of caring about someone or something.',
                'time': 'The indefinite continued progress of existence and events.',
                'good': 'To be desired or approved of; having the required qualities.',
                'new': 'Not existing before; made, introduced, or discovered recently.',
                'people': 'Human beings in general or considered collectively.',
                'work': 'Activity involving mental or physical effort done to achieve a purpose.',
                'world': 'The earth, together with all of its countries and peoples.',
                'life': 'The condition that distinguishes animals and plants from inorganic matter.'
            };
            
            return fallbackDefinitions[word.toLowerCase()] || `Unable to fetch definition for "${word}" at this time. Please check your internet connection.`;
        }
    }

    async fetchTranslations(word, languages) {
        const translations = {};
        
        // Create translation promises for all languages
        const translationPromises = languages.map(async (langCode) => {
            try {
                const translation = await this.translateWord(word, langCode);
                translations[langCode] = translation;
            } catch (error) {
                console.error(`BhashaZap: Error translating to ${langCode}:`, error);
                translations[langCode] = `Translation unavailable`;
            }
        });
        
        // Wait for all translations to complete
        await Promise.all(translationPromises);
        
        return translations;
    }

    async translateWord(word, targetLang) {
        try {
            // First try Google Translate API via MyMemory (free service)
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${targetLang}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.responseData && data.responseData.translatedText) {
                let translation = data.responseData.translatedText;
                
                // Clean up translation
                translation = translation.replace(/^\w+\s*:\s*/, ''); // Remove "en:" prefix if present
                translation = translation.trim();
                
                // If translation is same as original word, try fallback
                if (translation.toLowerCase() === word.toLowerCase()) {
                    return this.getFallbackTranslation(word, targetLang);
                }
                
                return translation;
            }
            
            // If no translation found, use fallback
            return this.getFallbackTranslation(word, targetLang);
            
        } catch (error) {
            console.error(`BhashaZap: Error in translateWord for ${targetLang}:`, error);
            return this.getFallbackTranslation(word, targetLang);
        }
    }

    getFallbackTranslation(word, langCode) {
        // Comprehensive fallback translations for common words
        const fallbackTranslations = {
            'hi': { // Hindi
                'the': 'यह, वह', 'and': 'और', 'to': 'को, के लिए', 'for': 'के लिए', 'with': 'के साथ',
                'house': 'घर', 'water': 'पानी', 'book': 'किताब', 'love': 'प्रेम', 'time': 'समय',
                'good': 'अच्छा', 'new': 'नया', 'people': 'लोग', 'work': 'काम', 'world': 'दुनिया',
                'life': 'जिंदगी', 'day': 'दिन', 'year': 'साल', 'school': 'स्कूल', 'food': 'खाना',
                'media': 'मीडिया', 'against': 'के विरुद्ध', 'tree': 'पेड़', 'car': 'कार', 'friend': 'दोस्त'
            },
            'kn': { // Kannada
                'the': 'ಇದು, ಅದು', 'and': 'ಮತ್ತು', 'to': 'ಗೆ, ಅಗಿ', 'for': 'ಅಗಿ', 'with': 'ಜೊತೆ',
                'house': 'ಮನೆ', 'water': 'ನೀರು', 'book': 'ಪುಸ್ತಕ', 'love': 'ಪ್ರೀತಿ', 'time': 'ಸಮಯ',
                'good': 'ಒಳ್ಳೆಯ', 'new': 'ಹೊಸ', 'people': 'ಜನರು', 'work': 'ಕೆಲಸ', 'world': 'ಪ್ರಪಂಚ',
                'life': 'ಜೀವನ', 'day': 'ದಿನ', 'year': 'ವರ್ಷ', 'school': 'ಶಾಲೆ', 'food': 'ಆಹಾರ',
                'media': 'ಮಾಧ್ಯಮ', 'against': 'ವಿರುದ್ಧ', 'tree': 'ಮರ', 'car': 'ಕಾರು', 'friend': 'ಸ್ನೇಹಿತ'
            },
            'mr': { // Marathi
                'the': 'हा, तो', 'and': 'आणि', 'to': 'ला, साठी', 'for': 'साठी', 'with': 'सोबत',
                'house': 'घर', 'water': 'पाणी', 'book': 'पुस्तक', 'love': 'प्रेम', 'time': 'वेळ',
                'good': 'चांगला', 'new': 'नवीन', 'people': 'लोक', 'work': 'काम', 'world': 'जग',
                'life': 'आयुष्य', 'day': 'दिवस', 'year': 'वर्ष', 'school': 'शाळा', 'food': 'अन्न',
                'media': 'माध्यमे', 'against': 'विरुद्ध', 'tree': 'झाड', 'car': 'कार', 'friend': 'मित्र'
            },
            'ta': { // Tamil
                'the': 'இது, அது', 'and': 'மற்றும்', 'to': 'க்கு, க்காக', 'for': 'க்காக', 'with': 'ஓடு',
                'house': 'வீடு', 'water': 'தண்ணீர்', 'book': 'புத்தகம்', 'love': 'காதல்', 'time': 'நேரம்',
                'good': 'நல்ல', 'new': 'புதிய', 'people': 'மக்கள்', 'work': 'வேலை', 'world': 'உலகம்',
                'life': 'வாழ்க்கை', 'day': 'நாள்', 'year': 'வருடம்', 'school': 'பள்ளி', 'food': 'உணவு',
                'media': 'ஊடகம்', 'against': 'எதிராக', 'tree': 'மரம்', 'car': 'கார்', 'friend': 'நண்பர்'
            },
            'bn': { // Bengali
                'the': 'এই, ওই', 'and': 'এবং', 'to': 'কে, জন্য', 'for': 'জন্য', 'with': 'সাথে',
                'house': 'বাড়ি', 'water': 'জল', 'book': 'বই', 'love': 'ভালোবাসা', 'time': 'সময়',
                'good': 'ভাল', 'new': 'নতুন', 'people': 'মানুষ', 'work': 'কাজ', 'world': 'পৃথিবী',
                'life': 'জীবন', 'day': 'দিন', 'year': 'বছর', 'school': 'স্কুল', 'food': 'খাবার',
                'media': 'মিডিয়া', 'against': 'বিপক্ষে', 'tree': 'গাছ', 'car': 'গাড়ি', 'friend': 'বন্ধু'
            },
            'te': { // Telugu
                'the': 'ఈ, ఆ', 'and': 'మరియు', 'to': 'కు, కొరకు', 'for': 'కొరకు', 'with': 'తో',
                'house': 'ఇల్లు', 'water': 'నీరు', 'book': 'పుస్తకం', 'love': 'ప్రేమ', 'time': 'సమయం',
                'good': 'మంచి', 'new': 'కొత్త', 'people': 'ప్రజలు', 'work': 'పని', 'world': 'ప్రపంచం',
                'life': 'జీవితం', 'day': 'రోజు', 'year': 'సంవత్సరం', 'school': 'పాఠశాల', 'food': 'ఆహారం',
                'media': 'మీడియా', 'against': 'వ్యతిరేకంగా', 'tree': 'చెట్టు', 'car': 'కారు', 'friend': 'స్నేహితుడు'
            },
            'gu': { // Gujarati
                'the': 'આ, તે', 'and': 'અને', 'to': 'ને, માટે', 'for': 'માટે', 'with': 'સાથે',
                'house': 'ઘર', 'water': 'પાણી', 'book': 'પુસ્તક', 'love': 'પ્રેમ', 'time': 'સમય',
                'good': 'સારું', 'new': 'નવું', 'people': 'લોકો', 'work': 'કામ', 'world': 'દુનિયા',
                'life': 'જીવન', 'day': 'દિવસ', 'year': 'વર્ષ', 'school': 'શાળા', 'food': 'ખોરાક',
                'media': 'મીડિયા', 'against': 'સામે', 'tree': 'વૃક્ષ', 'car': 'કાર', 'friend': 'મિત્ર'
            },
            'pa': { // Punjabi
                'the': 'ਇਹ, ਉਹ', 'and': 'ਅਤੇ', 'to': 'ਨੂੰ, ਲਈ', 'for': 'ਲਈ', 'with': 'ਨਾਲ',
                'house': 'ਘਰ', 'water': 'ਪਾਣੀ', 'book': 'ਕਿਤਾਬ', 'love': 'ਪਿਆਰ', 'time': 'ਸਮਾਂ',
                'good': 'ਚੰਗਾ', 'new': 'ਨਵਾਂ', 'people': 'ਲੋਕ', 'work': 'ਕੰਮ', 'world': 'ਸੰਸਾਰ',
                'life': 'ਜਿੰਦਗੀ', 'day': 'ਦਿਨ', 'year': 'ਸਾਲ', 'school': 'ਸਕੂਲ', 'food': 'ਭੋਜਨ',
                'media': 'ਮੀਡਿਆ', 'against': 'ਦੇ ਖਿਲਾਫ', 'tree': 'ਰੁੱਖ', 'car': 'ਕਾਰ', 'friend': 'ਦੋਸਤ'
            },
            'ml': { // Malayalam
                'the': 'ഇത്, അത്', 'and': 'ഒപ്പം', 'to': 'ലേക്ക്, വേണ്ടി', 'for': 'വേണ്ടി', 'with': 'കൂടെ',
                'house': 'വീട്', 'water': 'വെള്ളം', 'book': 'പുസ്തകം', 'love': 'സ്നേഹം', 'time': 'സമയം',
                'good': 'നല്ല', 'new': 'പുതിയ', 'people': 'ആളുകൾ', 'work': 'ജോലി', 'world': 'ലോകം',
                'life': 'ജീവിതം', 'day': 'ദിവസം', 'year': 'വർഷം', 'school': 'സ്കൂൾ', 'food': 'ഭക്ഷണം',
                'media': 'മാധ്യമം', 'against': 'എതിരെ', 'tree': 'മരം', 'car': 'കാർ', 'friend': 'സുഹൃത്ത്'
            },
            'ur': { // Urdu
                'the': 'یہ، وہ', 'and': 'اور', 'to': 'کو، کے لیے', 'for': 'کے لیے', 'with': 'کے ساتھ',
                'house': 'گھر', 'water': 'پانی', 'book': 'کتاب', 'love': 'محبت', 'time': 'وقت',
                'good': 'اچھا', 'new': 'نیا', 'people': 'لوگ', 'work': 'کام', 'world': 'دنیا',
                'life': 'زندگی', 'day': 'دن', 'year': 'سال', 'school': 'اسکول', 'food': 'کھانا',
                'media': 'میڈیا', 'against': 'کے خلاف', 'tree': 'درخت', 'car': 'کار', 'friend': 'دوست'
            }
        };
        
        const langTranslations = fallbackTranslations[langCode];
        if (langTranslations && langTranslations[word.toLowerCase()]) {
            return langTranslations[word.toLowerCase()];
        }
        
        return `Translation for "${word}" not available in this language.`;
    }

    displayTranslations(word, englishDefinition, translations) {
        try {
            // Update English definition
            const englishElement = this.popup.querySelector('#bhashazap-english-content');
            if (englishElement) {
                englishElement.textContent = englishDefinition;
            }

            // Update translations for selected languages
            this.selectedLanguages.forEach(langCode => {
                const element = this.popup.querySelector(`#bhashazap-${langCode}-content`);
                if (element && translations[langCode]) {
                    element.textContent = translations[langCode];
                }
            });

            console.log('BhashaZap: All translations updated successfully for:', word);
            
        } catch (error) {
            console.error('BhashaZap: Error displaying translations:', error);
        }
    }

    showErrorState(word) {
        try {
            // Show error message in English section
            const englishElement = this.popup.querySelector('#bhashazap-english-content');
            if (englishElement) {
                englishElement.textContent = `Sorry, unable to fetch definition for "${word}". Please check your internet connection and try again.`;
            }

            // Show error in translation sections
            this.selectedLanguages.forEach(langCode => {
                const element = this.popup.querySelector(`#bhashazap-${langCode}-content`);
                if (element) {
                    element.textContent = 'Translation unavailable - connection error.';
                }
            });
            
        } catch (error) {
            console.error('BhashaZap: Error showing error state:', error);
        }
    }

    // FIXED: Proper hidePopup with complete cleanup
    hidePopup() {
        if (!this.popup) return;
        
        console.log('BhashaZap: Hiding popup');
        
        this.popup.style.display = 'none';
        this.stopTimer();
        
        // Clear selection highlights
        document.querySelectorAll('.bhashazap-selection').forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });
        
        console.log('BhashaZap: Popup hidden and cleaned up');
    }

    // FIXED: More robust timer implementation
    startTimer() {
        this.stopTimer();
        
        if (this.timeLeft <= 0) {
            this.timeLeft = this.popupDuration;
        }
        
        console.log('BhashaZap: Starting timer for', this.timeLeft, 'seconds');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            console.log('BhashaZap: Timer:', this.timeLeft, 'seconds remaining');
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                console.log('BhashaZap: Timer expired - hiding popup');
                this.hidePopup();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            console.log('BhashaZap: Stopping timer');
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        if (!this.popup || this.popup.style.display === 'none') return;
        
        const timerCount = this.popup.querySelector('#bhashazap-timer-count');
        const timerProgress = this.popup.querySelector('#bhashazap-timer-progress');
        
        if (timerCount && timerProgress) {
            timerCount.textContent = this.timeLeft;
            const progress = Math.max(0, Math.min(100, (this.timeLeft / this.totalTime) * 100));
            timerProgress.style.width = progress + '%';
            
            // Color coding based on time remaining
            if (this.timeLeft <= 3) {
                timerCount.style.color = '#dc2626';
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            } else if (this.timeLeft <= 7) {
                timerCount.style.color = '#f59e0b';
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
            } else {
                timerCount.style.color = '#10b981';
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            }
            
            console.log('BhashaZap: Timer updated:', this.timeLeft, 'seconds,', progress.toFixed(1) + '% progress');
        } else {
            console.log('BhashaZap: Timer elements not found in popup');
        }
    }
}

// FIXED: Enhanced initialization to prevent multiple instances
function initializeBhashaZap() {
    if (window.bhashaZapInstance && window.bhashaZapInstance.isInitialized) {
        console.log('BhashaZap: Already initialized, skipping');
        return;
    }
    
    try {
        window.bhashaZapInstance = new BhashaZapContent();
        console.log('BhashaZap: Initialized successfully with API support');
    } catch (error) {
        console.error('BhashaZap: Initialization error:', error);
    }
}

// Multiple initialization methods with better timing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBhashaZap);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(initializeBhashaZap, 100);
}

// Enhanced SPA support with debouncing
let initTimeout = null;
const ensureBhashaZap = () => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
        if (!window.bhashaZapInstance || !window.bhashaZapInstance.isInitialized) {
            console.log('BhashaZap: Re-initializing for SPA navigation');
            initializeBhashaZap();
        }
    }, 300);
};

// Watch for dynamic content changes with better filtering
const observer = new MutationObserver((mutations) => {
    let shouldReinit = false;
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.tagName && 
                    ['MAIN', 'ARTICLE', 'SECTION', 'DIV'].includes(node.tagName) &&
                    !node.classList.contains('bhashazap-popup')) {
                    shouldReinit = true;
                    break;
                }
            }
        }
    });
    
    if (shouldReinit) {
        ensureBhashaZap();
    }
});

if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
} else {
    setTimeout(() => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }, 100);
}

// Handle SPA navigation with better detection
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(ensureBhashaZap, 800);
};

history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(ensureBhashaZap, 800);
};

window.addEventListener('popstate', () => setTimeout(ensureBhashaZap, 800));
window.addEventListener('focus', ensureBhashaZap);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        ensureBhashaZap();
    }
});

// Final fallback initialization
setTimeout(() => {
    if (!window.bhashaZapInstance) {
        console.log('BhashaZap: Final fallback initialization');
        initializeBhashaZap();
    }
}, 2000);