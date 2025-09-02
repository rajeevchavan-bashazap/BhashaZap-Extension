class BhashaZapContent {
    constructor() {
        this.popup = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Create popup container
        this.createPopup();
        
        // Enhanced double-click detection with better event handling
        let clickCount = 0;
        let clickTimer = null;
        
        document.addEventListener('mouseup', (e) => {
            // Ignore clicks on the popup itself
            if (this.popup && this.popup.contains(e.target)) return;
            
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                this.handleDoubleClick(e);
            }
        }, true);

        // Alternative method - also listen for dblclick event
        document.addEventListener('dblclick', (e) => {
            if (!this.popup || !this.popup.contains(e.target)) {
                this.handleDoubleClick(e);
            }
        });

        // Hide popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popup && !this.popup.contains(e.target) && this.popup.classList.contains('show')) {
                this.hidePopup();
            }
        });

        // Prevent text selection while dragging
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });
    }

    createPopup() {
        if (this.popup) return;

        // Create popup HTML
        this.popup = document.createElement('div');
        this.popup.className = 'bhashazap-popup';
        this.popup.innerHTML = `
            <div class="popup-header" id="bhashazap-header">
                <span class="popup-title">Select a word</span>
                <div class="timer-container">
                    <span class="timer-count" id="bhashazap-timer-count">17</span>
                    <div class="timer-bar">
                        <div class="timer-progress" id="bhashazap-timer-progress"></div>
                    </div>
                </div>
                <button class="close-btn" id="bhashazap-close-btn">×</button>
            </div>
            
            <div class="popup-content">
                <div class="language-option english">
                    <div class="language-header">English</div>
                    <div class="language-content" id="bhashazap-english-content">
                        Select a word to see its translation
                    </div>
                </div>
                
                <div class="language-option kannada">
                    <div class="language-header">Kannada</div>
                    <div class="language-content" id="bhashazap-kannada-content">ಪದವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ</div>
                </div>
                
                <div class="language-option marathi">
                    <div class="language-header">Marathi</div>
                    <div class="language-content" id="bhashazap-marathi-content">शब्द निवडा</div>
                </div>
            </div>
            
            <div class="popup-footer">
                <span class="version-text">BhashaZap 2.0.0</span>
            </div>
        `;

        // Apply styles
        this.popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 280px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 2147483647;
            font-size: 14px;
            display: none;
            border: 1px solid #e0e0e0;
            cursor: move;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        // Append to body
        document.body.appendChild(this.popup);

        // Initialize popup functionality
        this.initializePopup();
    }

    initializePopup() {
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.timer = null;
        this.timeLeft = 17;
        this.totalTime = 17;

        const closeBtn = this.popup.querySelector('#bhashazap-close-btn');
        const header = this.popup.querySelector('#bhashazap-header');
        
        // Close button functionality
        closeBtn.addEventListener('click', () => {
            this.hidePopup();
        });

        // Drag functionality
        this.setupDrag(header);
    }

    setupDrag(header) {
        header.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.popup.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            this.popup.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            const maxX = window.innerWidth - this.popup.offsetWidth;
            const maxY = window.innerHeight - this.popup.offsetHeight;
            
            const constrainedX = Math.max(0, Math.min(x, maxX));
            const constrainedY = Math.max(0, Math.min(y, maxY));
            
            this.popup.style.left = constrainedX + 'px';
            this.popup.style.top = constrainedY + 'px';
            this.popup.style.transform = 'none';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.popup.style.cursor = 'move';
                document.body.style.userSelect = '';
            }
        });
    }

    handleDoubleClick(e) {
        // Enhanced selection detection
        let selectedText = '';
        let selection = null;

        // Try window selection first
        if (window.getSelection) {
            selection = window.getSelection();
            selectedText = selection.toString().trim();
        }

        // If no selection, try to get word under cursor
        if (!selectedText) {
            const element = e.target;
            if (element && element.textContent) {
                // Get word at click position
                const range = document.caretRangeFromPoint ? 
                    document.caretRangeFromPoint(e.clientX, e.clientY) : 
                    document.caretPositionFromPoint ? 
                        document.caretPositionFromPoint(e.clientX, e.clientY) : null;
                
                if (range) {
                    // Expand selection to word boundaries
                    const textNode = range.startContainer || range.offsetNode;
                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        const text = textNode.textContent;
                        let start = range.startOffset || range.offset;
                        let end = start;

                        // Find word boundaries
                        while (start > 0 && /\w/.test(text[start - 1])) {
                            start--;
                        }
                        while (end < text.length && /\w/.test(text[end])) {
                            end++;
                        }

                        selectedText = text.substring(start, end).trim();
                        
                        // Create selection
                        if (selectedText && window.getSelection) {
                            const newRange = document.createRange();
                            newRange.setStart(textNode, start);
                            newRange.setEnd(textNode, end);
                            selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                        }
                    }
                }
            }
        }

        // Show popup if we have selected text
        if (selectedText && selectedText.length > 0) {
            console.log('BhashaZap: Selected text:', selectedText);
            this.showPopup(e.clientX, e.clientY, selectedText);
            
            // Highlight selection
            if (selection && selection.rangeCount > 0) {
                this.highlightSelection(selection);
            }
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
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.className = 'bhashazap-selection';
            span.style.cssText = `
                background-color: #fff3cd !important;
                border-radius: 2px;
                padding: 1px 2px;
            `;
            range.surroundContents(span);
        } catch (e) {
            console.log('BhashaZap: Could not highlight selection:', e);
        }
    }

    showPopup(x, y, selectedText) {
        if (!this.popup) return;

        // Update content based on selected text
        this.popup.querySelector('.popup-title').textContent = selectedText;
        
        // Here you would typically call your translation API
        // For now, showing placeholder content
        this.updateTranslations(selectedText);
        
        // Reset timer
        this.timeLeft = this.totalTime;
        this.updateTimer();
        
        // Position popup near cursor but ensure it's visible
        let popupX = x + 10;
        let popupY = y + 10;
        
        // Adjust if popup would go off-screen
        if (popupX + 280 > window.innerWidth) {
            popupX = x - 290;
        }
        if (popupY + 200 > window.innerHeight) {
            popupY = y - 210;
        }
        
        // Ensure popup stays within bounds
        popupX = Math.max(10, Math.min(popupX, window.innerWidth - 290));
        popupY = Math.max(10, Math.min(popupY, window.innerHeight - 210));
        
        this.popup.style.left = popupX + 'px';
        this.popup.style.top = popupY + 'px';
        this.popup.style.transform = 'none';
        this.popup.style.display = 'block';
        this.popup.classList.add('show');
        
        // Start countdown timer
        this.startTimer();
    }

    updateTranslations(word) {
        // This is where you'd integrate with your translation service
        // For demonstration, using sample translations
        const translations = {
            'farmers': {
                english: 'A person who works the land and/or who keeps livestock, especially on a farm.',
                kannada: 'ರೈತರು',
                marathi: 'शेतकरी'
            },
            // Add more translations as needed
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
        this.popup.classList.remove('show');
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
                timerCount.style.color = '#ff0000';
            } else {
                timerCount.style.color = '#ff4444';
            }
        }
    }
}

// Initialize the content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BhashaZapContent();
    });
} else {
    new BhashaZapContent();
}

// Also handle dynamic content loading
let bhashazapInstance = null;
const observer = new MutationObserver(() => {
    if (!bhashazapInstance) {
        bhashazapInstance = new BhashaZapContent();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});