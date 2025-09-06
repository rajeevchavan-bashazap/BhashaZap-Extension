// BhashaZap Content Script - Working Version with Increment Timer
(function() {
    'use strict';

    // Extension state
    let isActive = true;
    let selectedLanguages = ['kn', 'hi'];
    let popupDuration = 15;
    let currentPopup = null;
    let timer = null;

    // Language names
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

    // Simple word dictionary
    const dictionary = {
        english: {
            "house": "a building where people live",
            "water": "a clear liquid that has no color, taste, or smell",
            "book": "a set of printed pages held together in a cover",
            "time": "the thing that is measured in minutes, hours, days",
            "love": "a strong feeling of caring about someone",
            "good": "of high quality; better than average",
            "work": "activity involving mental or physical effort",
            "world": "the earth and all people and things on it",
            "friend": "a person you know well and like",
            "school": "a place where children go to learn"
        },
        hi: {
            "house": "घर", "water": "पानी", "book": "किताब", "time": "समय",
            "love": "प्रेम", "good": "अच्छा", "work": "काम", "world": "दुनिया",
            "friend": "दोस्त", "school": "स्कूल"
        },
        kn: {
            "house": "ಮನೆ", "water": "ನೀರು", "book": "ಪುಸ್ತಕ", "time": "ಸಮಯ",
            "love": "ಪ್ರೀತಿ", "good": "ಒಳ್ಳೆಯದು", "work": "ಕೆಲಸ", "world": "ಪ್ರಪಂಚ",
            "friend": "ಸ್ನೇಹಿತ", "school": "ಶಾಲೆ"
        }
    };

    // Initialize
    function init() {
        console.log('BhashaZap: Initializing...');
        
        // Load settings
        if (chrome && chrome.storage) {
            chrome.storage.sync.get({
                selectedLanguages: ['kn', 'hi'],
                isExtensionActive: true,
                popupDuration: 15
            }, function(result) {
                selectedLanguages = result.selectedLanguages || ['kn', 'hi'];
                isActive = result.isExtensionActive !== false;
                popupDuration = result.popupDuration || 15;
                console.log('BhashaZap: Settings loaded');
            });
        }

        // Setup double-click listener
        document.addEventListener('dblclick', handleDoubleClick, true);
        
        // Setup click listener to hide popup
        document.addEventListener('click', function(e) {
            if (currentPopup && !currentPopup.contains(e.target)) {
                hidePopup();
            }
        }, true);

        console.log('BhashaZap: Initialized successfully');
    }

    // Handle double click
    function handleDoubleClick(e) {
        if (!isActive) return;
        
        try {
            e.preventDefault();
            e.stopPropagation();
            
            const word = getWordAtClick(e);
            if (word && word.length > 1) {
                console.log('BhashaZap: Word selected:', word);
                showPopup(word, e.clientX, e.clientY);
            }
        } catch (error) {
            console.error('BhashaZap: Error in double click:', error);
        }
    }

    // Get word at click position
    function getWordAtClick(e) {
        try {
            const element = e.target;
            const text = element.textContent || element.innerText || '';
            
            if (!text.trim()) return '';
            
            // Get first word from element
            const words = text.trim().split(/\s+/);
            for (let word of words) {
                const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                if (cleanWord.length > 1) {
                    return cleanWord.toLowerCase();
                }
            }
            return '';
        } catch (error) {
            console.error('BhashaZap: Error getting word:', error);
            return '';
        }
    }

    // Show popup
    function showPopup(word, x, y) {
        try {
            hidePopup();
            
            const popup = createPopupElement(word);
            document.body.appendChild(popup);
            currentPopup = popup;
            
            // Position popup
            positionPopup(popup, x, y);
            
            // Start timer
            startTimer(popup);
            
            console.log('BhashaZap: Popup shown for:', word);
        } catch (error) {
            console.error('BhashaZap: Error showing popup:', error);
        }
    }

    // Create popup element
    function createPopupElement(word) {
        const popup = document.createElement('div');
        popup.className = 'bhashazap-popup';
        
        const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
        
        // Get translations
        const englishDef = dictionary.english[word] || `Definition of "${word}" not available`;
        let translationsHTML = `
            <div class="bhashazap-translation">
                <div class="bhashazap-lang-name">English</div>
                <div class="bhashazap-translation-text">${englishDef}</div>
            </div>
        `;
        
        // Add selected language translations
        selectedLanguages.forEach(langCode => {
            const langName = languageNames[langCode] || langCode.toUpperCase();
            const translation = dictionary[langCode] && dictionary[langCode][word] 
                ? dictionary[langCode][word] 
                : `Translation not available`;
            
            translationsHTML += `
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">${langName}</div>
                    <div class="bhashazap-translation-text">${translation}</div>
                </div>
            `;
        });
        
        popup.innerHTML = `
            <div class="bhashazap-header">
                <div class="bhashazap-word">${capitalizedWord}</div>
                <button class="bhashazap-close">×</button>
            </div>
            <div class="bhashazap-countdown-container">
                <div class="bhashazap-timer-number">0</div>
                <div class="bhashazap-countdown-bar">
                    <div class="bhashazap-countdown-progress" style="width: 0%;"></div>
                </div>
            </div>
            <div class="bhashazap-translations">
                ${translationsHTML}
            </div>
            <div class="bhashazap-footer">
                <div class="bhashazap-brand">BhashaZap 2.0.0</div>
            </div>
        `;
        
        // Add close button listener
        const closeBtn = popup.querySelector('.bhashazap-close');
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hidePopup();
        });
        
        return popup;
    }

    // Position popup
    function positionPopup(popup, x, y) {
        const rect = popup.getBoundingClientRect();
        let left = x - rect.width / 2;
        let top = y - rect.height - 10;
        
        // Keep within viewport
        if (left < 10) left = 10;
        if (left + rect.width > window.innerWidth - 10) {
            left = window.innerWidth - rect.width - 10;
        }
        if (top < 10) top = y + 10;
        
        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
    }

    // Start increment timer
    function startTimer(popup) {
        if (timer) {
            clearInterval(timer);
        }
        
        const timerNumber = popup.querySelector('.bhashazap-timer-number');
        const progressBar = popup.querySelector('.bhashazap-countdown-progress');
        
        if (!timerNumber || !progressBar) return;
        
        let elapsed = 0;
        const total = popupDuration;
        
        timer = setInterval(function() {
            elapsed += 0.1;
            
            if (elapsed >= total) {
                clearInterval(timer);
                hidePopup();
                return;
            }
            
            // Update display
            const seconds = Math.floor(elapsed);
            const percentage = (elapsed / total) * 100;
            
            timerNumber.textContent = seconds;
            timerNumber.style.color = '#10b981';
            progressBar.style.width = percentage + '%';
            progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            
        }, 100);
    }

    // Hide popup
    function hidePopup() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        
        if (currentPopup && currentPopup.parentNode) {
            currentPopup.parentNode.removeChild(currentPopup);
        }
        currentPopup = null;
    }

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('BhashaZap: Script loaded');

})();