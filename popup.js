class BhashaZapPopup {
    constructor() {
        this.popup = document.getElementById('popup');
        this.closeBtn = document.getElementById('close-btn');
        this.timerCount = document.getElementById('timer-count');
        this.timerProgress = document.getElementById('timer-progress');
        
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.timer = null;
        this.timeLeft = 17;
        this.totalTime = 17;
        
        this.init();
    }

    init() {
        // Close button
        this.closeBtn.addEventListener('click', () => {
            this.hidePopup();
        });

        // Improved drag functionality
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
            this.isDragging = true;
            const rect = this.popup.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            // Add dragging class for visual feedback
            this.popup.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            // Keep popup within viewport bounds
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

    showPopup(x, y, selectedText) {
        // Update content based on selected text
        document.querySelector('.popup-title').textContent = selectedText;
        
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
            this.timerCount.style.color = '#ff0000';
        } else {
            this.timerCount.style.color = '#ff4444';
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