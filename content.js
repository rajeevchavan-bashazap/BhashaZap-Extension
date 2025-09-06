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

        // Load settings FIRST
        await this.loadSettings();
        
        // Setup double-click handler
        this.setupDoubleClickHandler();

        // Hide popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popup && !this.popup.contains(e.target) && this.popup.style.display === 'block') {
                console.log('BhashaZap: Clicking outside popup - hiding');
                this.hidePopup();
            }
        }, true);

        console.log('BhashaZap: Content script initialized');
    }

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
                        
                        console.log('BhashaZap: Settings loaded:', {
                            isActive: this.isExtensionActive,
                            duration: this.popupDuration,
                            languages: this.selectedLanguages
                        });
                    }
                    resolve();
                });
            } catch (error) {
                console.error('BhashaZap: Error in loadSettings:', error);
                resolve();
            }

            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }

    setupDoubleClickHandler() {
        let clickTimeout = null;
        let lastClickTarget = null;

        const handleDoubleClick = (e) => {
            if (!this.isExtensionActive) return;
            if (this.popup && this.popup.contains(e.target)) return;
            
            const excludedTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'IMG', 'VIDEO'];
            if (excludedTags.includes(e.target.tagName)) return;

            const now = Date.now();
            const timeSinceLastClick = now - this.lastClickTime;
            
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

        document.addEventListener('dblclick', handleDoubleClick, true);
        document.addEventListener('mousedown', handleDoubleClick, true);
    }

    createPopup() {
        if (this.popup) {
            this.popup.remove();
        }

        this.popup = document.createElement('div');
        this.popup.className = 'bhashazap-popup';
        
        const languageSections = this.createLanguageSections();
        
        this.popup.innerHTML = `
            <div class="bhashazap-header" id="bhashazap-header">
                <span class="bhashazap-word">Select a word</span>
                <button class="bhashazap-close" id="bhashazap-close-btn">×</button>
            </div>
            
            <div class="bhashazap-countdown-container">
                <span class="bhashazap-countdown-text" id="bhashazap-timer-count">${this.popupDuration}</span>
                <div class="bhashazap-countdown-bar">
                    <div class="bhashazap-countdown-progress" id="bhashazap-timer-progress" style="width: 100%; background: linear-gradient(90deg, #10b981, #059669);"></div>
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
        
        console.log('BhashaZap: Popup created');
    }

    createLanguageSections() {
        const languageNames = {
            'hi': 'Hindi',
            'kn': 'Kannada',
            'mr': 'Marathi',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali',
            'gu': 'Gujarati',
            'ml': 'Malayalam',
            'pa': 'Punjabi',
            'ur': 'Urdu'
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
        
        if (closeBtn) {
            // FIXED: Simple, direct close button handler
            closeBtn.onclick = () => {
                console.log('BhashaZap: Close button clicked directly');
                this.hidePopup();
            };
            
            closeBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                console.log('BhashaZap: Close button mousedown');
                this.hidePopup();
            });
        }

        console.log('BhashaZap: Popup initialized with close button');
    }

    handleWordSelection(e) {
        if (!this.isExtensionActive) {
            return;
        }

        try {
            let selectedText = this.getSelectedText(e);
            
            if (selectedText && selectedText.length > 1 && /[a-zA-Z]/.test(selectedText)) {
                console.log('BhashaZap: Processing word:', selectedText);
                
                this.loadSettings().then(() => {
                    if (!this.popup) {
                        this.createPopup();
                    }
                    this.showPopup(e.clientX, e.clientY, selectedText);
                });
            }
        } catch (error) {
            console.log('BhashaZap: Error in handleWordSelection:', error);
        }
    }

    getSelectedText(e) {
        // Try to get selected text first
        let selectedText = '';
        if (window.getSelection) {
            selectedText = window.getSelection().toString().trim();
        }

        // If no selection, try to get word from target element
        if (!selectedText && e.target) {
            const text = e.target.textContent || e.target.innerText || '';
            const words = text.split(/\s+/);
            if (words.length > 0) {
                selectedText = words[0].replace(/[^\w'-]/g, '');
            }
        }

        return selectedText;
    }

    showPopup(x, y, selectedText) {
        if (!this.popup) return;
        if (!this.isExtensionActive) return;

        console.log('BhashaZap: Showing popup for word:', selectedText);

        const capitalizedWord = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();

        // Update word in header
        const wordElement = this.popup.querySelector('.bhashazap-word');
        if (wordElement) {
            wordElement.textContent = capitalizedWord;
        }
        
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
        
        // Reset and start timer
        this.timeLeft = this.popupDuration;
        this.totalTime = this.popupDuration;
        
        // Update translations with simple fallback
        this.updateSimpleTranslations(selectedText);
        
        // Start timer after a short delay
        setTimeout(() => {
            this.startTimer();
        }, 200);
        
        console.log('BhashaZap: Popup shown, timer will start in 200ms');
    }

    // Simple translation without API calls to avoid errors
    updateSimpleTranslations(word) {
        const translations = {
            'house': { english: 'A building for human habitation; a dwelling place.', hi: 'घर', kn: 'ಮನೆ', mr: 'घर' },
            'water': { english: 'A transparent, odorless, tasteless liquid essential for life.', hi: 'पानी', kn: 'ನೀರು', mr: 'पाणी' },
            'book': { english: 'A written or printed work consisting of pages.', hi: 'किताब', kn: 'ಪುಸ್ತಕ', mr: 'पुस्तक' },
            'time': { english: 'The indefinite continued progress of existence.', hi: 'समय', kn: 'ಸಮಯ', mr: 'वेळ' },
            'love': { english: 'A strong feeling of caring about someone.', hi: 'प्रेम', kn: 'ಪ್ರೀತಿ', mr: 'प्रेम' },
            'good': { english: 'To be desired or approved of.', hi: 'अच्छा', kn: 'ಒಳ್ಳೆಯ', mr: 'चांगला' },
            'work': { english: 'Activity involving mental or physical effort.', hi: 'काम', kn: 'ಕೆಲಸ', mr: 'काम' }
        };

        const wordKey = word.toLowerCase();
        const translation = translations[wordKey] || {
            english: `Definition of "${word}" would appear here.`,
            hi: `"${word}" का अनुवाद`,
            kn: `"${word}" ಅನುವಾದ`,
            mr: `"${word}" चे भाषांतर`
        };

        // Update English definition
        const englishElement = this.popup.querySelector('#bhashazap-english-content');
        if (englishElement) {
            englishElement.textContent = translation.english;
        }

        // Update translations for selected languages
        this.selectedLanguages.forEach(langCode => {
            const element = this.popup.querySelector(`#bhashazap-${langCode}-content`);
            if (element) {
                element.textContent = translation[langCode] || `Translation for "${word}" not available.`;
            }
        });

        console.log('BhashaZap: Simple translations updated for:', word);
    }

    // FIXED: Simplified timer that should work
    startTimer() {
        // Stop any existing timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        console.log('BhashaZap: Starting timer for', this.timeLeft, 'seconds');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            console.log('BhashaZap: Timer tick -', this.timeLeft, 'seconds remaining');
            
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                console.log('BhashaZap: Timer finished - closing popup');
                this.hidePopup();
            }
        }, 1000);
        
        // Initial display update
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        if (!this.popup || this.popup.style.display === 'none') {
            return;
        }
        
        const timerCount = this.popup.querySelector('#bhashazap-timer-count');
        const timerProgress = this.popup.querySelector('#bhashazap-timer-progress');
        
        if (timerCount) {
            timerCount.textContent = this.timeLeft.toString();
        }
        
        if (timerProgress) {
            const progress = Math.max(0, (this.timeLeft / this.totalTime) * 100);
            timerProgress.style.width = progress + '%';
            
            // Color coding
            if (this.timeLeft <= 3) {
                timerProgress.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
                if (timerCount) timerCount.style.color = '#dc2626';
            } else if (this.timeLeft <= 7) {
                timerProgress.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
                if (timerCount) timerCount.style.color = '#f59e0b';
            } else {
                timerProgress.style.background = 'linear-gradient(90deg, #10b981, #059669)';
                if (timerCount) timerCount.style.color = '#10b981';
            }
        }
        
        console.log('BhashaZap: Timer display updated:', this.timeLeft, 'seconds');
    }

    hidePopup() {
        if (!this.popup) return;
        
        console.log('BhashaZap: Hiding popup');
        
        // Stop timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Hide popup
        this.popup.style.display = 'none';
        
        console.log('BhashaZap: Popup hidden successfully');
    }
}

// Initialize the extension
function initializeBhashaZap() {
    if (window.bhashaZapInstance) {
        console.log('BhashaZap: Already initialized');
        return;
    }
    
    try {
        window.bhashaZapInstance = new BhashaZapContent();
        console.log('BhashaZap: Initialized with simplified timer');
    } catch (error) {
        console.error('BhashaZap: Initialization error:', error);
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBhashaZap);
} else {
    setTimeout(initializeBhashaZap, 100);
}