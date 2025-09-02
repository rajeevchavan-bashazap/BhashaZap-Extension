class BhashaZapPopup {
    constructor() {
        this.popup = document.getElementById('popup');
        this.closeBtn = document.getElementById('close-btn');
        this.timerCount = document.getElementById('timer-count');
        this.timerProgress = document.getElementById('timer-progress');
        
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.startPosition = { x: 0, y: 0 };
        this.timer = null;
        this.timeLeft = 17;
        this.totalTime = 17;
        
        this.init();
    }

    init() {
        // Close button
        this.closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hidePopup();
        });

        // Fixed drag functionality
        this.setupDrag();

        // Hide popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.popup.contains(e.target) && this.popup.classList.contains('show')) {
                this.hidePopup();
            }
        });

        // Prevent text selection while dragging
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });

        // Listen for messages from content script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'showPopup') {
                    this.showPopup(request.x, request.y, request.text);
                }
            });
        }
    }

    setupDrag() {
        const header = document.getElementById('popup-header');
        
        header.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.isDragging = true;
            
            // Get current popup position
            const rect = this.popup.getBoundingClientRect();
            this.startPosition.x = rect.left;
            this.startPosition.y = rect.top;
            
            // Record initial mouse position
            this.dragOffset.x = e.clientX;
            this.dragOffset.y = e.clientY;
            
            // Visual feedback
            header.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            this.popup.style.transform = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            
            // Calculate movement delta
            const deltaX = e.clientX - this.dragOffset.x;
            const deltaY = e.clientY - this.dragOffset.y;
            
            // Calculate new position
            let newX = this.startPosition.x + deltaX;
            let newY = this.startPosition.y + deltaY;
            
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
                
                // Update start position for next drag
                const rect = this.popup.getBoundingClientRect();
                this.startPosition.x = rect.left;
                this.startPosition.y = rect.top;
            }
        });
    }

    showPopup(x, y, selectedText) {
        // Update content based on selected text
        document.querySelector('.popup-title').textContent = selectedText;
        
        // Reset timer
        this.timeLeft = this.totalTime;
        this.updateTimer();
        
        // Position popup near cursor but ensure it's visible
        const popupWidth = 280;
        const popupHeight = 320;
        
        let popupX = x + 15;
        let popupY = y + 15;
        
        // Adjust if popup would go off-screen
        if (popupX + popupWidth > window.innerWidth) {
            popupX = x - popupWidth - 15;
        }
        if (popupY + popupHeight > window.innerHeight) {
            popupY = y - popupHeight - 15;
        }
        
        // Ensure popup stays within bounds with margins
        popupX = Math.max(10, Math.min(popupX, window.innerWidth - popupWidth - 10));
        popupY = Math.max(10, Math.min(popupY, window.innerHeight - popupHeight - 10));
        
        // Set position
        this.popup.style.left = popupX + 'px';
        this.popup.style.top = popupY + 'px';
        this.popup.style.transform = 'none';
        
        // Update start position for dragging
        this.startPosition.x = popupX;
        this.startPosition.y = popupY;
        
        this.popup.classList.add('show');
        
        // Start countdown timer
        this.startTimer();
    }

    hidePopup() {
        this.popup.classList.remove('show');
        this.stopTimer();
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
        this.timerCount.textContent = this.timeLeft;
        const progress = (this.timeLeft / this.totalTime) * 100;
        this.timerProgress.style.width = progress + '%';
        
        // Change color when time is running out
        if (this.timeLeft <= 5) {
            this.timerCount.style.color = '#dc2626';
            this.timerCount.style.fontWeight = '900';
        } else {
            this.timerCount.style.color = '#ef4444';
            this.timerCount.style.fontWeight = '900';
        }
    }
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    new BhashaZapPopup();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BhashaZapPopup();
    });
} else {
    new BhashaZapPopup();
}