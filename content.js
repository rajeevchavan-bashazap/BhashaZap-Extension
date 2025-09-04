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
        this.selectedLanguages = ['kn', 'mr']; // Default fallback
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Load settings FIRST before setting up anything
        await this.loadSettings();
        
        this.setupUniversalClickHandler();

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

    // FIXED: Proper async settings loading
    loadSettings() {
        return new Promise((resolve) => {
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.log('BhashaZap: Chrome APIs not available, using defaults');
                resolve();
                return;
            }

            chrome.runtime.sendMessage({action: 'getSettings'}, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('BhashaZap: Error loading settings:', chrome.runtime.lastError);
                    resolve();
                    return;
                }

                if (response && response.success) {
                    this.isExtensionActive = response.isExtensionActive !== false;
                    this.popupDuration = response.popupDuration || 15;
                    this.selectedLanguages = response.selectedLanguages || ['kn', 'mr'];
                    this.totalTime = this.popupDuration;
                    this.timeLeft = this.popupDuration;
                    
                    console.log('BhashaZap: Settings loaded successfully:', {
                        isActive: this.isExtensionActive,
                        duration: this.popupDuration,
                        languages: this.selectedLanguages
                    });
                } else {
                    console.log('BhashaZap: Failed to load settings, using defaults');
                }
                resolve();
            });

            // Timeout fallback
            setTimeout(() => {
                console.log('BhashaZap: Settings load timeout, using defaults');
                resolve();
            }, 2000);
        });
    }

    setupUniversalClickHandler() {
        let clickTimeout = null;

        const handleAnyClick = (e) => {
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
            
            if (timeSinceLastClick > 500) {
                this.clickCount = 0;
            }
            
            this.clickCount++;
            this.lastClickTime = now;
            
            if (this.clickCount === 1) {
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => {
                    this.clickCount = 0;
                }, 400);
            } else if (this.clickCount === 2) {
                clearTimeout(clickTimeout);
                this.clickCount = 0;
                this.handleDoubleClick(e);
            }
        };

        document.addEventListener('mousedown', handleAnyClick, true);
        document.addEventListener('click', handleAnyClick, true);
        document.addEventListener('dblclick', (e) => {
            if (!this.popup || !this.popup.contains(e.target)) {
                this.handleDoubleClick(e);
            }
        }, true);
    }

    createPopup() {
        if (this.popup) {
            // Remove existing popup first
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

        this.popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 2147483647;
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
        
        // FIXED: Proper close button handler
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('BhashaZap: Close button clicked');
            this.hidePopup();
        });

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

    handleDoubleClick(e) {
        if (!this.isExtensionActive) {
            console.log('BhashaZap: Extension disabled, ignoring double-click');
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
            console.log('BhashaZap: Error in handleDoubleClick:', error);
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

        // Update word in header
        const wordElement = this.popup.querySelector('.bhashazap-word');
        if (wordElement) {
            wordElement.textContent = selectedText;
        }
        
        // Update translations
        this.updateTranslations(selectedText);
        
        // FIXED: Proper timer initialization
        this.timeLeft = this.popupDuration;
        this.totalTime = this.popupDuration;
        
        // Position popup
        const popupWidth = 280;
        const popupHeight = 320;
        
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
        
        // Start timer AFTER popup is visible
        this.updateTimer();
        this.startTimer();
        
        console.log('BhashaZap: Popup displayed successfully');
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

    // FIXED: Complete translation database with proper lookups
    updateTranslations(word) {
        const translations = {
            'media': {
                english: 'The main means of mass communication (broadcasting, publishing, and the internet).',
                hi: 'मीडिया',
                bn: 'মিডিয়া',
                te: 'మీడియా',
                mr: 'माध्यमे',
                ta: 'ஊடகம்',
                ur: 'میڈیا',
                gu: 'મીડિયા',
                kn: 'ಮಾಧ್ಯಮ',
                ml: 'മാധ്യമം',
                pa: 'ਮੀਡਿਆ'
            },
            'against': {
                english: 'In opposition to; contrary to; in conflict with something.',
                hi: 'के विरुद्ध',
                bn: 'বিপক্ষে',
                te: 'వ్యతిరేకంగా',
                mr: 'विरुद्ध',
                ta: 'எதிராக',
                ur: 'کے خلاف',
                gu: 'સામે',
                kn: 'ವಿರುದ್ಧ',
                ml: 'എതിരെ',
                pa: 'ਦੇ ਖਿਲਾਫ'
            },
            'house': {
                english: 'A building for human habitation; a dwelling place.',
                hi: 'घर',
                bn: 'বাড়ি',
                te: 'ఇల్లు',
                mr: 'घर',
                ta: 'வீடு',
                ur: 'گھر',
                gu: 'ઘર',
                kn: 'ಮನೆ',
                ml: 'വീട്',
                pa: 'ਘਰ'
            },
            'water': {
                english: 'A transparent, odorless, tasteless liquid essential for life.',
                hi: 'पानी',
                bn: 'জল',
                te: 'నీరు',
                mr: 'पाणी',
                ta: 'தண்ணீர்',
                ur: 'پانی',
                gu: 'પાણી',
                kn: 'ನೀರು',
                ml: 'വെള്ളം',
                pa: 'ਪਾਣੀ'
            },
            'book': {
                english: 'A written or printed work consisting of pages glued or sewn together.',
                hi: 'किताब',
                bn: 'বই',
                te: 'పుస్తకం',
                mr: 'पुस्तक',
                ta: 'புத்தகம்',
                ur: 'کتاب',
                gu: 'પુસ્તક',
                kn: 'ಪುಸ್ತಕ',
                ml: 'പുസ്തകം',
                pa: 'ਕਿਤਾਬ'
            },
            'school': {
                english: 'An institution for teaching and learning.',
                hi: 'स्कूल',
                bn: 'স্কুল',
                te: 'పాఠశాల',
                mr: 'शाळा',
                ta: 'பள்ளி',
                ur: 'اسکول',
                gu: 'શાળા',
                kn: 'ಶಾಲೆ',
                ml: 'സ്കൂൾ',
                pa: 'ਸਕੂਲ'
            },
            'time': {
                english: 'The indefinite continued progress of existence and events.',
                hi: 'समय',
                bn: 'সময়',
                te: 'సమయం',
                mr: 'वेळ',
                ta: 'நேரம்',
                ur: 'وقت',
                gu: 'સમય',
                kn: 'ಸಮಯ',
                ml: 'സമയം',
                pa: 'ਸਮਾਂ'
            },
            'love': {
                english: 'A strong feeling of caring about someone or something.',
                hi: 'प्रेम',
                bn: 'ভালোবাসা',
                te: 'ప్రేమ',
                mr: 'प्रेम',
                ta: 'காதல்',
                ur: 'محبت',
                gu: 'પ્રેમ',
                kn: 'ಪ್ರೀತಿ',
                ml: 'സ്നേഹം',
                pa: 'ਪਿਆਰ'
            }
        };

        const wordKey = word.toLowerCase();
        const translation = translations[wordKey];
        
        try {
            // Update English definition
            const englishElement = this.popup.querySelector('#bhashazap-english-content');
            if (englishElement) {
                if (translation && translation.english) {
                    englishElement.textContent = translation.english;
                } else {
                    englishElement.textContent = `"${word}" - Definition would appear here if available.`;
                }
            }

            // Update translations for selected languages
            this.selectedLanguages.forEach(langCode => {
                const element = this.popup.querySelector(`#bhashazap-${langCode}-content`);
                if (element) {
                    if (translation && translation[langCode]) {
                        element.textContent = translation[langCode];
                        console.log(`BhashaZap: Set ${langCode} translation:`, translation[langCode]);
                    } else {
                        element.textContent = `"${word}" translation not available in this language.`;
                    }
                }
            });

            console.log('BhashaZap: Translation update completed for:', word);
        } catch (error) {
            console.error('BhashaZap: Error updating translations:', error);
        }
    }

    // FIXED: Proper hidePopup with cleanup
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

    // FIXED: Robust timer implementation
    startTimer() {
        this.stopTimer();
        
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

// Enhanced initialization
function initializeBhashaZap() {
    if (window.bhashaZapInstance) return;
    
    try {
        window.bhashaZapInstance = new BhashaZapContent();
        console.log('BhashaZap: Initialized successfully');
    } catch (error) {
        console.error('BhashaZap: Initialization error:', error);
    }
}

// Multiple initialization methods
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBhashaZap);
} else {
    setTimeout(initializeBhashaZap, 100);
}

// Enhanced SPA support
let initTimeout = null;
const ensureBhashaZap = () => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
        if (!window.bhashaZapInstance || !window.bhashaZapInstance.isInitialized) {
            initializeBhashaZap();
        }
    }, 200);
};

// Watch for dynamic content changes
const observer = new MutationObserver((mutations) => {
    let shouldReinit = false;
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.tagName && 
                    ['MAIN', 'ARTICLE', 'SECTION', 'DIV'].includes(node.tagName)) {
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

// Handle SPA navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(ensureBhashaZap, 500);
};

history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(ensureBhashaZap, 500);
};

window.addEventListener('popstate', () => setTimeout(ensureBhashaZap, 500));
window.addEventListener('focus', ensureBhashaZap);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        ensureBhashaZap();
    }
});

// Final fallback
setTimeout(() => {
    if (!window.bhashaZapInstance) {
        console.log('BhashaZap: Fallback initialization');
        initializeBhashaZap();
    }
}, 1000);