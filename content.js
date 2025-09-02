class BhashaZapContent {
    constructor() {
        this.popup = null;
        this.isInitialized = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.timer = null;
        this.timeLeft = 17;
        this.totalTime = 17;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Create popup container
        this.createPopup();
        
        // Enhanced double-click detection with better compatibility
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
    }

    setupDoubleClickHandler() {
        let clickCount = 0;
        let clickTimer = null;
        let lastClickTime = 0;

        // Use multiple event handlers for better compatibility
        const handleClick = (e) => {
            // Ignore clicks on the popup itself
            if (this.popup && this.popup.contains(e.target)) return;
            
            const currentTime = Date.now();
            const timeDiff = currentTime - lastClickTime;
            
            // Reset if too much time has passed
            if (timeDiff > 500) {
                clickCount = 0;
            }
            
            clickCount++;
            lastClickTime = currentTime;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 400);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                this.handleDoubleClick(e);
            }
        };

        // Multiple event listeners for better compatibility
        document.addEventListener('mouseup', handleClick, true);
        document.addEventListener('click', handleClick, true);
        
        // Fallback dblclick listener
        document.addEventListener('dblclick', (e) => {
            if (!this.popup || !this.popup.contains(e.target)) {
                this.handleDoubleClick(e);
            }
        }, true);
    }

    createPopup() {
        if (this.popup) return;

        // Create popup HTML with compact design
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

        // Set initial styles
        this.popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 2147483647;
        `;

        // Append to body
        document.body.appendChild(this.popup);

        // Initialize popup functionality
        this.initializePopup();
    }

    initializePopup() {
        const closeBtn = this.popup.querySelector('#bhashazap-close-btn');
        const header = this.popup.querySelector('#bhashazap-header');
        
        // Close button functionality
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hidePopup();
        });

        // Fixed drag functionality
        this.setupDrag(header);
    }

    setupDrag(header) {
        let startX = 0, startY = 0, initialX = 0, initialY = 0;
        
        header.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.isDragging = true;
            
            // Get current position
            const rect = this.popup.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // Record mouse position
            startX = e.clientX;
            startY = e.clientY;
            
            // Add visual feedback
            header.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            this.popup.style.transform = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            
            // Calculate new position
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Keep popup within viewport bounds
            const popupRect = this.popup.getBoundingClientRect();
            const maxX = window.innerWidth - popupRect.width;
            const maxY = window.innerHeight - popupRect.height;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            // Apply new position
            this.popup.style.left = newX + 'px';
            this.popup.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                header.style.cursor = 'grab';
                document.body.style.userSelect = '';
                
                // Update initial position for next drag
                const rect = this.popup.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
            }
        });
    }

    handleDoubleClick(e) {
        try {
            // Enhanced selection detection for better website compatibility
            let selectedText = '';
            let selection = null;

            // Try multiple methods to get selected text
            if (window.getSelection) {
                selection = window.getSelection();
                selectedText = selection.toString().trim();
            }

            // If no selection, try to get word under cursor
            if (!selectedText) {
                selectedText = this.getWordAtPoint(e.clientX, e.clientY, e.target);
            }

            // Clean up selected text
            if (selectedText) {
                selectedText = selectedText.replace(/[^\w\s'-]/g, '').trim();
                
                // Only process if it's a valid word (not just spaces or punctuation)
                if (selectedText.length > 0 && /[a-zA-Z]/.test(selectedText)) {
                    console.log('BhashaZap: Selected text:', selectedText);
                    this.showPopup(e.clientX, e.clientY, selectedText);
                    
                    // Highlight selection if we have one
                    if (selection && selection.rangeCount > 0) {
                        this.highlightSelection(selection);
                    }
                }
            }
        } catch (error) {
            console.log('BhashaZap: Error in handleDoubleClick:', error);
        }
    }

    getWordAtPoint(x, y, targetElement) {
        try {
            // Method 1: caretRangeFromPoint (Chrome/Safari)
            if (document.caretRangeFromPoint) {
                const range = document.caretRangeFromPoint(x, y);
                if (range) {
                    return this.expandToWordBoundaries(range);
                }
            }
            
            // Method 2: caretPositionFromPoint (Firefox)
            if (document.caretPositionFromPoint) {
                const caret = document.caretPositionFromPoint(x, y);
                if (caret && caret.offsetNode) {
                    const range = document.createRange();
                    range.setStart(caret.offsetNode, caret.offset);
                    range.setEnd(caret.offsetNode, caret.offset);
                    return this.expandToWordBoundaries(range);
                }
            }
            
            // Method 3: Fallback - use target element's text
            if (targetElement && targetElement.textContent) {
                const text = targetElement.textContent.trim();
                const words = text.split(/\s+/);
                // Return first meaningful word
                for (let word of words) {
                    if (word.length > 2 && /[a-zA-Z]/.test(word)) {
                        return word.replace(/[^\w'-]/g, '');
                    }
                }
            }
            
            return '';
        } catch (error) {
            console.log('BhashaZap: Error in getWordAtPoint:', error);
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

            // Expand backwards to word boundary
            while (start > 0 && /[\w'-]/.test(text[start - 1])) {
                start--;
            }

            // Expand forwards to word boundary
            while (end < text.length && /[\w'-]/.test(text[end])) {
                end++;
            }

            const word = text.substring(start, end).trim();
            
            // Create new selection for the word
            if (word && window.getSelection) {
                const newRange = document.createRange();
                newRange.setStart(textNode, start);
                newRange.setEnd(textNode, end);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
            
            return word;
        } catch (error) {
            console.log('BhashaZap: Error in expandToWordBoundaries:', error);
            return '';
        }
    }

    highlightSelection(selection) {
        // Remove existing highlights
        document.querySelectorAll('.bhashazap-selection').forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });

        // Add new highlight
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
            console.log('BhashaZap: Could not highlight selection:', e);
        }
    }

    showPopup(x, y, selectedText) {
        if (!this.popup) return;

        // Update content
        this.popup.querySelector('.bhashazap-word').textContent = selectedText;
        this.updateTranslations(selectedText);
        
        // Reset timer
        this.timeLeft = this.totalTime;
        this.updateTimer();
        
        // Calculate position with better viewport handling
        const popupWidth = 280;
        const popupHeight = 320;
        
        let popupX = x + 15;
        let popupY = y + 15;
        
        // Adjust for viewport boundaries
        if (popupX + popupWidth > window.innerWidth) {
            popupX = x - popupWidth - 15;
        }
        if (popupY + popupHeight > window.innerHeight) {
            popupY = y - popupHeight - 15;
        }
        
        // Ensure minimum margins
        popupX = Math.max(10, Math.min(popupX, window.innerWidth - popupWidth - 10));
        popupY = Math.max(10, Math.min(popupY, window.innerHeight - popupHeight - 10));
        
        // Set position and show
        this.popup.style.left = popupX + 'px';
        this.popup.style.top = popupY + 'px';
        this.popup.style.transform = 'none';
        this.popup.style.display = 'block';
        
        // Start countdown timer
        this.startTimer();
    }

    adjustPopupPosition() {
        if (!this.popup || this.popup.style.display === 'none') return;
        
        const rect = this.popup.getBoundingClientRect();
        let newX = rect.left;
        let newY = rect.top;
        let changed = false;
        
        // Check if popup is outside viewport
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
        // Sample translations - replace with your translation service
        const translations = {
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
        
        // Remove highlights
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

    updateTimer() {
        const timerCount = this.popup.querySelector('#bhashazap-timer-count');
        const timerProgress = this.popup.querySelector('#bhashazap-timer-progress');
        
        if (timerCount && timerProgress) {
            timerCount.textContent = this.timeLeft;
            const progress = (this.timeLeft / this.totalTime) * 100;
            timerProgress.style.width = progress + '%';
            
            // Change color when time is running out
            if (this.timeLeft <= 5) {
                timerCount.style.color = '#dc2626';
                timerCount.style.fontWeight = '900';
            } else {
                timerCount.style.color = '#ef4444';
                timerCount.style.fontWeight = '900';
            }
        }
    }
}

// Enhanced initialization with better compatibility
function initializeBhashaZap() {
    // Prevent multiple instances
    if (window.bhashaZapInstance) return;
    
    window.bhashaZapInstance = new BhashaZapContent();
}

// Multiple initialization methods for better compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBhashaZap);
} else {
    initializeBhashaZap();
}

// Handle dynamic content loading and SPA navigation
let initTimeout = null;
const ensureBhashaZap = () => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
        if (!window.bhashaZapInstance) {
            initializeBhashaZap();
        }
    }, 100);
};

// Watch for page changes (for SPAs like Quora)
const observer = new MutationObserver(ensureBhashaZap);
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Handle history changes (for SPAs)
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
    originalPushState.apply(history, arguments);
    ensureBhashaZap();
};

history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    ensureBhashaZap();
};

window.addEventListener('popstate', ensureBhashaZap);

// Ensure initialization on focus (for better compatibility)
window.addEventListener('focus', () => {
    if (!window.bhashaZapInstance) {
        ensureBhashaZap();
    }
}