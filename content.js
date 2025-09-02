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
        
        // ENHANCED: Better double-click detection for all sites
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

        console.log('BhashaZap: Enhanced content script loaded');
    }

    // ENHANCED: Universal click handler for better site compatibility
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
            
            // Reset if too much time passed
            if (timeSinceLastClick > 500) {
                this.clickCount = 0;
            }
            
            this.clickCount++;
            this.lastClickTime = now;
            
            if (this.clickCount === 1) {
                // First click - wait for potential second click
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => {
                    this.clickCount = 0;
                }, 400);
            } else if (this.clickCount === 2) {
                // Double click detected
                clearTimeout(clickTimeout);
                this.clickCount = 0;
                this.handleDoubleClick(e);
            }
        };

        // Multiple event listeners for maximum compatibility
        document.addEventListener('mousedown', handleAnyClick, true);
        document.addEventListener('click', handleAnyClick, true);
        
        // Fallback for native double-click
        document.addEventListener('dblclick', (e) => {
            if (!this.popup || !this.popup.contains(e.target)) {
                this.handleDoubleClick(e);
            }
        }, true);
    }

    createPopup() {
        if (this.popup) return;

        // Create popup HTML with NEW COMPACT design and RED text countdown
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

        // Set initial styles for COMPACT popup
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

        // FIXED: Smooth drag functionality
        this.setupSmoothDrag(header);
    }

    // FIXED: Completely rewritten drag system for smooth movement
    setupSmoothDrag(header) {
        const onMouseDown = (e) => {
            // Don't drag if clicking close button
            if (e.target.classList.contains('bhashazap-close')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            this.isDragging = true;
            
            // Record starting positions
            const rect = this.popup.getBoundingClientRect();
            this.popupStart.x = rect.left;
            this.popupStart.y = rect.top;
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            
            // Visual feedback
            header.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            this.popup.style.transform = 'none';
            
            // Add global listeners
            document.addEventListener('mousemove', onMouseMove, { passive: false });
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Calculate movement
            const deltaX = e.clientX - this.dragStart.x;
            const deltaY = e.clientY - this.dragStart.y;
            
            // Calculate new position
            let newX = this.popupStart.x + deltaX;
            let newY = this.popupStart.y + deltaY;
            
            // Keep within viewport bounds
            const popupRect = this.popup.getBoundingClientRect();
            const maxX = window.innerWidth - popupRect.width;
            const maxY = window.innerHeight - popupRect.height;
            
            newX = Math.max(10, Math.min(newX, maxX - 10));
            newY = Math.max(10, Math.min(newY, maxY - 10));
            
            // Apply position smoothly
            this.popup.style.left = newX + 'px';
            this.popup.style.top = newY + 'px';
        };

        const onMouseUp = (e) => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            header.style.cursor = 'grab';
            document.body.style.userSelect = '';
            
            // Remove global listeners
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        header.addEventListener('mousedown', onMouseDown);
        header.style.cursor = 'grab';
    }

    // ENHANCED: Better word detection for complex sites like Quora/Goodreads
    handleDoubleClick(e) {
        try {
            let selectedText = '';
            let selection = null;

            // Method 1: Try existing selection
            if (window.getSelection) {
                selection = window.getSelection();
                selectedText = selection.toString().trim();
            }

            // Method 2: Enhanced word detection at point for complex sites
            if (!selectedText) {
                selectedText = this.getWordAtPointEnhanced(e.clientX, e.clientY, e.target);
            }

            // Clean up selected text
            if (selectedText) {
                selectedText = selectedText.replace(/[^\w\s'-]/g, '').trim();
                
                // Only process valid English words
                if (selectedText.length > 1 && /[a-zA-Z]/.test(selectedText)) {
                    console.log('BhashaZap: Selected text:', selectedText);
                    this.showPopup(e.clientX, e.clientY, selectedText);
                    
                    // Highlight selection
                    if (selection && selection.rangeCount > 0) {
                        this.highlightSelection(selection);
                    }
                }
            }
        } catch (error) {
            console.log('BhashaZap: Error in handleDoubleClick:', error);
        }
    }

    // ENHANCED: Universal word detection that works on all sites
    getWordAtPointEnhanced(x, y, targetElement) {
        try {
            let result = '';

            // Method 1: Modern browsers with caretRangeFromPoint
            if (document.caretRangeFromPoint) {
                try {
                    const range = document.caretRangeFromPoint(x, y);
                    if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                        result = this.expandToWordBoundaries(range);
                        if (result) return result;
                    }
                } catch (e) {
                    console.log('BhashaZap: caretRangeFromPoint failed, trying fallback');
                }
            }
            
            // Method 2: Firefox with caretPositionFromPoint
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
                    console.log('BhashaZap: caretPositionFromPoint failed, trying fallback');
                }
            }
            
            // Method 3: Enhanced fallback for complex sites (Quora, Goodreads, etc.)
            if (!result && targetElement) {
                result = this.extractWordFromElement(targetElement);
            }
            
            return result;
        } catch (error) {
            console.log('BhashaZap: Error in getWordAtPointEnhanced:', error);
            return '';
        }
    }

    // NEW: Extract word from element for complex sites
    extractWordFromElement(element) {
        try {
            let currentElement = element;
            let attempts = 0;
            
            while (currentElement && attempts < 5) {
                const text = currentElement.textContent || currentElement.innerText || '';
                
                if (text.trim()) {
                    // Split text into words and find valid English words
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
            console.log('BhashaZap: Error extracting word from element:', error);
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

            // Expand backwards
            while (start > 0 && /[a-zA-Z'-]/.test(text[start - 1])) {
                start--;
            }

            // Expand forwards  
            while (end < text.length && /[a-zA-Z'-]/.test(text[end])) {
                end++;
            }

            const word = text.substring(start, end).trim();
            
            // Create selection for the word
            if (word && window.getSelection) {
                try {
                    const newRange = document.createRange();
                    newRange.setStart(textNode, start);
                    newRange.setEnd(textNode, end);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } catch (e) {
                    // Selection might fail on some sites, that's okay
                }
            }
            
            return word;
        } catch (error) {
            console.log('BhashaZap: Error expanding word boundaries:', error);
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
            // Highlight might fail on some complex DOM structures
            console.log('BhashaZap: Could not highlight selection');
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
        
        // COMPACT positioning - smaller popup
        const popupWidth = 280; // Reduced from 320
        const popupHeight = 300; // Reduced from 350
        
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
        // Enhanced translations with more words
        const translations = {
            'urban': {
                english: 'Related to the (or any) city.',
                kannada: 'ನಗರ ಪ್ರದೇಶ',
                marathi: 'शहरी'
            },
            'mark': {
                english: 'Mistaken or incorrect; not accurate.',
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

    // FIXED: Timer with RED text countdown
    updateTimer() {
        const timerCount = this.popup.querySelector('#bhashazap-timer-count');
        const timerProgress = this.popup.querySelector('#bhashazap-timer-progress');
        
        if (timerCount && timerProgress) {
            timerCount.textContent = this.timeLeft;
            const progress = (this.timeLeft / this.totalTime) * 100;
            timerProgress.style.width = progress + '%';
            
            // RED text that changes intensity as time runs out
            if (this.timeLeft <= 5) {
                timerCount.style.color = '#dc2626'; // Darker red
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            } else if (this.timeLeft <= 10) {
                timerCount.style.color = '#ef4444'; // Medium red
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
            } else {
                timerCount.style.color = '#ef4444'; // Default red
                timerCount.style.fontWeight = '900';
                timerProgress.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            }
        }
    }
}

// Enhanced initialization for better compatibility across all sites
function initializeBhashaZap() {
    // Prevent multiple instances
    if (window.bhashaZapInstance) return;
    
    try {
        window.bhashaZapInstance = new BhashaZapContent();
        console.log('BhashaZap: Initialized successfully');
    } catch (error) {
        console.error('BhashaZap: Initialization error:', error);
    }
}

// Multiple initialization methods for better compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBhashaZap);
} else {
    // DOM already ready
    setTimeout(initializeBhashaZap, 100);
}

// Enhanced SPA support for sites like Quora, Goodreads
let initTimeout = null;
const ensureBhashaZap = () => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
        if (!window.bhashaZapInstance || !window.bhashaZapInstance.isInitialized) {
            initializeBhashaZap();
        }
    }, 200);
};

// Watch for dynamic content changes (critical for SPAs)
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
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} else {
    setTimeout(() => {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
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

window.addEventListener('popstate', () => {
    setTimeout(ensureBhashaZap, 500);
});

// Ensure initialization on focus/visibility change
window.addEventListener('focus', ensureBhashaZap);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        ensureBhashaZap();
    }
});

// Final fallback initialization
setTimeout(() => {
    if (!window.bhashaZapInstance) {
        console.log('BhashaZap: Fallback initialization');
        initializeBhashaZap();
    }
}, 1000);