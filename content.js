class BhashaZapContent {
    constructor() {
        this.popup = null;
        this.timer = null;
        this.timeLeft = 15;
        this.totalTime = 15;
        this.isExtensionActive = true;
        this.popupDuration = 15;
        this.init();
    }

    init() {
        console.log('BhashaZap: Starting initialization');
        
        // Multiple event listeners for better site compatibility
        document.addEventListener('dblclick', (e) => {
            console.log('BhashaZap: Double-click detected');
            this.handleDoubleClick(e);
        }, true); // Use capture phase
        
        // Backup handler for sites that prevent dblclick
        let clickCount = 0;
        let clickTimer = null;
        document.addEventListener('click', (e) => {
            clickCount++;
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 400);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                console.log('BhashaZap: Double-click via click handler');
                this.handleDoubleClick(e);
            }
        }, true);

        console.log('BhashaZap: Initialization complete');
    }

    handleDoubleClick(e) {
        // Get any word from the clicked element
        let word = this.getWordFromElement(e.target);
        
        if (word) {
            console.log('BhashaZap: Found word:', word);
            this.showPopup(e.clientX, e.clientY, word);
        } else {
            console.log('BhashaZap: No word found');
        }
    }

    getWordFromElement(element) {
        let text = element.textContent || element.innerText || '';
        
        // Get first valid word
        let words = text.split(/\s+/);
        for (let word of words) {
            word = word.replace(/[^a-zA-Z]/g, '');
            if (word.length > 2) {
                return word;
            }
        }
        
        return 'example'; // fallback word for testing
    }

    showPopup(x, y, word) {
        console.log('BhashaZap: Showing popup for:', word);
        
        if (!this.popup) {
            this.createPopup();
        }

        // Update word
        let wordElement = this.popup.querySelector('.bhashazap-word');
        if (wordElement) {
            wordElement.textContent = word.charAt(0).toUpperCase() + word.slice(1);
        }

        // Position popup
        this.popup.style.left = Math.min(x + 20, window.innerWidth - 300) + 'px';
        this.popup.style.top = Math.min(y + 20, window.innerHeight - 400) + 'px';
        this.popup.style.display = 'block';

        // Start timer
        this.timeLeft = this.popupDuration;
        this.startTimer();
        
        console.log('BhashaZap: Popup shown, timer started');
    }

    createPopup() {
        console.log('BhashaZap: Creating popup');
        
        this.popup = document.createElement('div');
        this.popup.className = 'bhashazap-popup';
        
        this.popup.innerHTML = `
            <div class="bhashazap-header">
                <span class="bhashazap-word">Word</span>
                <button class="bhashazap-close" onclick="window.bhashaZapInstance.hidePopup()">×</button>
            </div>
            
            <div class="bhashazap-countdown-container">
                <span class="bhashazap-countdown-text" id="timer-display">${this.popupDuration}</span>
                <div class="bhashazap-countdown-bar">
                    <div class="bhashazap-countdown-progress" id="timer-bar" style="width: 100%; background: green; height: 4px;"></div>
                </div>
            </div>
            
            <div class="bhashazap-translations">
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">English</div>
                    <div class="bhashazap-translation-text">Definition will appear here</div>
                </div>
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">Hindi</div>
                    <div class="bhashazap-translation-text">हिंदी अनुवाद</div>
                </div>
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">Kannada</div>
                    <div class="bhashazap-translation-text">ಕನ್ನಡ ಅನುವಾದ</div>
                </div>
            </div>
        `;

        // Popup styles
        this.popup.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 280px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: none;
        `;

        document.body.appendChild(this.popup);
        console.log('BhashaZap: Popup created and added to DOM');
    }

    hidePopup() {
        console.log('BhashaZap: Hiding popup - START');
        
        // Stop timer first
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('BhashaZap: Timer stopped');
        }
        
        // Hide popup
        if (this.popup) {
            this.popup.style.display = 'none';
            console.log('BhashaZap: Popup display set to none');
        }
        
        console.log('BhashaZap: Hiding popup - COMPLETE');
    }

    startTimer() {
        // Clear any existing timer first
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Reset timer values
        this.timeLeft = this.popupDuration;
        this.totalTime = this.popupDuration;

        console.log('BhashaZap: Timer started for', this.timeLeft, 'seconds');

        this.timer = setInterval(() => {
            this.timeLeft--;
            console.log('BhashaZap: Timer tick -', this.timeLeft, 'seconds remaining');
            
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                console.log('BhashaZap: Timer reached 0 - calling hidePopup');
                this.hidePopup();
                return; // Exit the interval
            }
        }, 1000);
        
        // Initial timer display
        this.updateTimer();
    }
}

// Initialize
window.bhashaZapInstance = new BhashaZapContent();
console.log('BhashaZap: Instance created');