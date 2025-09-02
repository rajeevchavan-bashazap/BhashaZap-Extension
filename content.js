class BhashaZapContent {
    constructor() {
        this.popup = null;
        this.isInitialized = false;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.popupStart = { x: 0, y: 0 };
        this.timer = null;
        this.timeLeft = 17;
        this.totalTime = 17;
        this.lastClickTime = 0;
        this.clickCount = 0;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Create popup container
        this.createPopup();
        
        // Enhanced double-click detection
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

        // Handle scroll and resize events
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

        console.log('BhashaZap: Final enhanced content script loaded');
    }

    // Universal click handler for better site compatibility
    setupUniversalClickHandler() {
        let clickTimeout = null;

        const handleAnyClick = (e) => {
            // Ignore clicks on popup
            if (this.popup && this.popup.contains(e.target)) return;
            
            // Ignore excluded elements
            const excludedTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'IMG', 'VIDEO'];
            const excludedClasses = ['nav', 'menu', 'ad', 'advertisement', 'header', 'footer'];
            
            if (excludedTags.includes(e.target.tagName) || 
                excludedClasses.some(cls => e.target.className && e.target.className.includes(cls))) {
                return;
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
        if (this.popup) return;

        // Create compact colorful popup
        this.popup = document.createElement('div');
        this.popup.className = 'bhashazap-popup';
        this.popup.innerHTML = `
            <div class="bhashazap-header" id="bhashazap-header">
                <span class="bhashazap-word">Select a word</span>
                <button class="bhashazap-close" id="bhashazap-close-btn">×</button>
            </div>
            
            <div class="bhashazap-countdown-container">
                <span class="bhashazap-countdown-text" id="bhashazap-timer-count">17</span>
                <div class="bhashazap-countdown-bar">
                    <div class="bhashazap-countdown-progress" id="bhashazap-timer-progress"></div>
                </div>
            </div>
            
            <div class="bhashazap-translations">
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">English</div>
                    <div class="bhashazap-translation-text" id="bhashazap-english-content">
                        Select a word to see its translation
                    </div>
                </div>
                
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">Kannada</div>
                    <div class="bhashazap-translation-text" id="bhashazap-kannada-content">ಪದವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ</div>
                </div>
                
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">Marathi</div>
                    <div class="bhashazap-translation-text" id="bhashazap-marathi-content">शब्द निवडा</div>
                </div>
            </div>
            
            <div class="bhashazap-footer">
                <span class="bhashazap-brand">BhashaZap 2.0.0</span>
            </div>
        `;

        // Compact positioning
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
    }

    initializePopup() {
        const closeBtn = this.popup.querySelector('#bhashazap-close-btn');
        const header = this.popup.querySelector('#bhashazap-header');
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hidePopup();
        });

        this.setupSmoothDrag(header);
    }

    // Fixed smooth drag functionality
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
            
            // Keep within viewport bounds
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

    // Enhanced word detection for all sites
    handleDoubleClick(e) {
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
                    console.log('BhashaZap: Selected text:', selectedText);
                    this.showPopup(e.clientX, e.clientY, selectedText);
                    
                    if (selection && selection.rangeCount > 0) {
                        this.highlightSelection(selection);
                    }
                }
            }
        } catch (error) {
            console.log('BhashaZap: Error in handleDoubleClick:', error);
        }
    }

    getWordAtPointEnhanced(x, y, targetElement) {
        try {
            let result = '';

            // Modern browsers
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
            
            // Firefox
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
            
            // Enhanced fallback for complex sites
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

        this.popup.querySelector('.bhashazap-word').textContent = selectedText;
        this.updateTranslations(selectedText);
        
        this.timeLeft = this.totalTime;
        this.updateTimer();
        
        // Compact positioning
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
        
        this.startTimer();
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

    updateTranslations(word) {
        // Enhanced translations database
        const translations = {
            'urban': {
                english: 'Related to the (or any) city.',
                kannada: 'ನಗರ ಪ್ರದೇಶ',
                marathi: 'शहरी'
            },
            'mark': {
                english: 'A sign, symbol, or stain on something.',
                kannada: 'ಗುರುತು',
                marathi: 'चिन्हांकित करा'
            },
            'investigation': {
                english: 'The act of investigating; the process of inquiring into or following up; research, especially patient or thorough inquiry or examination',
                kannada: 'ತಪಾಸಣೆ',
                marathi: 'तपास'
            },
            'corporations': {
                english: 'A body corporate, created by law or under authority of law, having a continuous existence independent of the existences of its members, and powers and liabilities distinct from those of its members.',
                kannada: 'ನಿಗಮಗಳು',
                marathi: 'महामंडळ'
            },
            'inaccurate': {
                english: 'Mistaken or incorrect; not accurate.',
                kannada: 'ತಪ್ಪಾದ',
                marathi: 'चुकीचा'
            },
            'historical': {
                english: 'Related to history or past events.',
                kannada: 'ಐತಿಹಾಸಿಕ',
                marathi: 'ऐतिहासिक'
            },
            'farmers': {
                english: 'A person who works the land and/or who keeps livestock, especially on a farm.',
                kannada: 'ರೈತರು',
                marathi: 'शेतकरी'
            },
            'water': {
                english: 'A transparent, odorless, tasteless liquid essential for life.',
                kannada: 'ನೀರು',
                marathi: 'पाणी'
            },
            'book': {
                english: 'A written or printed work consisting of pages glued or sewn together',
                kannada: 'ಪುಸ್ತಕ',
                marathi: 'पुस्तक'
            },
            'knowledge': {
                english: 'Facts, information, and skills acquired through experience or education',
                kannada: 'ಜ್ಞಾನ',
                marathi: 'ज्ञान'
            },
            'north': {
                english: 'The direction that is to your left when you are facing the rising sun',
                kannada: 'ಉತ್ತರ',
                marathi: 'उत्तर'
            },
            'south': {
                english: 'The direction that is to your right when you are facing the rising sun',
                kannada: 'ದಕ್ಷಿಣ',
                marathi: 'दक्षिण'
            },
            'love': {
                english: 'A strong feeling of caring about someone or something',
                kannada: 'ಪ್ರೀತಿ',
                marathi: 'प्रेम'
            },
            'time': {
                english: 'The thing that is measured in minutes, hours, days, etc.',
                kannada: 'ಸಮಯ',
                marathi: 'वेळ'
            }
        };

        const translation = translations[word.toLowerCase()] || {
            english: `Definition of "${word}" would appear here`,
            kannada: `"${word}" ಕನ್ನಡದಲ್ಲಿ`,
            marathi: `"${word}" मराठीत`
        };

        this.popup.querySelector('#bhashazap-english-content').textContent = translation.english;
        this.popup.querySelector('#bhashazap-kannada-content').textContent = translation.kannada;
        this.popup.querySelector('#bhashazap-marathi-content').textContent = translation.marathi;
    }

    hidePopup() {
        if (!this.popup) return;
        
        this.popup.style.display = 'none';
        this.stopTimer();
        
        document.querySelectorAll('.bhashazap-selection').forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });
    }

    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.hidePopup();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // Timer with RED text countdown (left side of progress bar)
    updateTimer() {
        const timerCount = this.popup.querySelector('#bhashazap-timer-count');
        const timerProgress = this.popup.querySelector('#bhashazap-timer-progress');
        
        if (timerCount && timerProgress) {
            timerCount.textContent = this.timeLeft;
            const progress = (this.timeLeft / this.totalTime) * 100;
            timerProgress.style.width = progress + '%';
            
            // RED text that changes intensity as time runs out
            if (this.timeLeft <= 5) {
                timerCount.style.color = '#dc2626';
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            } else if (this.timeLeft <= 10) {
                timerCount.style.color = '#ef4444';
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
            } else {
                timerCount.style.color = '#ef4444';
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            }
        }
    }
}

// Enhanced initialization for maximum compatibility
function initializeBhashaZap() {
    if (window.bhashaZapInstance) return;
    
    try {
        window.bhashaZapInstance = new BhashaZapContent();
        console.log('BhashaZap: Final version initialized successfully');
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

// Enhanced SPA support for complex sites
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