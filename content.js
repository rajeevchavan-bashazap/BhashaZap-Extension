// Enhanced Content Script for BhashaZap Extension - SYNTAX FIXED
(function() {
    'use strict';

    // Check if Chrome extension APIs are available
    if (!chrome || !chrome.storage) {
        console.warn('BhashaZap: Chrome extension APIs not available');
        return;
    }

    // Extension state
    let isActive = true;
    let selectedLanguages = [];
    let popupDuration = 15;
    let currentPopup = null;
    let isInitialized = false;
    let countdownInterval = null;
    let apiCallCount = 0;
    const MAX_API_CALLS_PER_MINUTE = 10;

    // Language mapping
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

    // Enhanced offline dictionary
    const offlineDictionary = {
        english: {
            "north": "the direction that is to your left when you are facing the rising sun",
            "south": "the direction that is to your right when you are facing the rising sun", 
            "east": "the direction toward the rising sun",
            "west": "the direction toward the setting sun",
            "water": "a clear liquid that has no color, taste, or smell",
            "fire": "the hot, glowing gas that you see when something burns",
            "earth": "the planet on which we live; soil or ground",
            "air": "the mixture of gases that surrounds the earth",
            "tree": "a large plant that has a wooden trunk and branches with leaves",
            "house": "a building where people live",
            "book": "a set of printed pages that are held together in a cover",
            "food": "things that people and animals eat",
            "love": "a strong feeling of caring about someone or something",
            "time": "the thing that is measured in minutes, hours, days, etc.",
            "light": "the brightness that comes from the sun, fire, etc.",
            "dark": "having little or no light",
            "good": "of high quality; better than average",
            "bad": "of poor quality; worse than average",
            "big": "large in size, amount, or degree",
            "small": "little in size, amount, or degree",
            "hello": "a greeting used when meeting someone",
            "world": "the earth and all the people and things on it",
            "computer": "an electronic machine that can store and process information",
            "internet": "a global network of connected computers",
            "phone": "a device used for talking to people at a distance",
            "car": "a vehicle with four wheels that is powered by an engine",
            "school": "a place where children go to learn",
            "work": "activity involving mental or physical effort",
            "money": "coins and bills used to buy things",
            "friend": "a person you know well and like"
        },
        
        hi: {
            "north": "उत्तर", "south": "दक्षिण", "east": "पूर्व", "west": "पश्चिम",
            "water": "पानी", "fire": "आग", "earth": "पृथ्वी", "air": "हवा",
            "tree": "पेड़", "house": "घर", "book": "किताब", "food": "खाना",
            "love": "प्रेम", "time": "समय", "light": "प्रकाश", "dark": "अंधेरा",
            "good": "अच्छा", "bad": "बुरा", "big": "बड़ा", "small": "छोटा",
            "hello": "नमस्ते", "world": "दुनिया", "computer": "कंप्यूटर", "internet": "इंटरनेट",
            "phone": "फोन", "car": "कार", "school": "स्कूल", "work": "काम",
            "money": "पैसा", "friend": "दोस्त"
        },
        
        kn: {
            "north": "ಉತ್ತರ", "south": "ದಕ್ಷಿಣ", "east": "ಪೂರ್ವ", "west": "ಪಶ್ಚಿಮ",
            "water": "ನೀರು", "fire": "ಬೆಂಕಿ", "earth": "ಭೂಮಿ", "air": "ಗಾಳಿ",
            "tree": "ಮರ", "house": "ಮನೆ", "book": "ಪುಸ್ತಕ", "food": "ಆಹಾರ",
            "love": "ಪ್ರೀತಿ", "time": "ಸಮಯ", "light": "ಬೆಳಕು", "dark": "ಕತ್ತಲೆ",
            "good": "ಒಳ್ಳೆಯದು", "bad": "ಕೆಟ್ಟದು", "big": "ದೊಡ್ಡದು", "small": "ಚಿಕ್ಕದು",
            "hello": "ನಮಸ್ಕಾರ", "world": "ಪ್ರಪಂಚ", "computer": "ಕಂಪ್ಯೂಟರ್", "internet": "ಇಂಟರ್ನೆಟ್",
            "phone": "ಫೋನ್", "car": "ಕಾರ್", "school": "ಶಾಲೆ", "work": "ಕೆಲಸ",
            "money": "ಹಣ", "friend": "ಸ್ನೇಹಿತ"
        }
    };

    // Initialize
    function init() {
        if (isInitialized) return;
        
        try {
            loadSettings();
            setupEventListeners();
            isInitialized = true;
            console.log('BhashaZap: Extension initialized successfully');
        } catch (error) {
            console.error('BhashaZap: Initialization error:', error);
            setTimeout(init, 1000);
        }
    }

    // Load settings
    function loadSettings() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('BhashaZap: Storage API not available');
                return;
            }

            chrome.storage.sync.get({
                selectedLanguages: [],
                isExtensionActive: true,
                popupDuration: 15
            }, function(result) {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.error('BhashaZap: Storage error:', chrome.runtime.lastError);
                    return;
                }
                
                selectedLanguages = result.selectedLanguages || [];
                isActive = result.isExtensionActive !== false;
                popupDuration = result.popupDuration || 15;
                
                console.log('BhashaZap: Settings loaded:', { 
                    selectedLanguages, 
                    isActive, 
                    popupDuration 
                });
            });
        } catch (error) {
            console.error('BhashaZap: Error loading settings:', error);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        document.removeEventListener('dblclick', handleDoubleClick, true);
        document.removeEventListener('click', handleClick, true);
        
        document.addEventListener('dblclick', handleDoubleClick, true);
        document.addEventListener('click', handleClick, true);

        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                try {
                    if (message.action === 'toggleExtension') {
                        isActive = message.isActive;
                        console.log('BhashaZap: Extension toggled:', isActive);
                        if (!isActive && currentPopup) {
                            hidePopup();
                        }
                        sendResponse({ success: true });
                    } else if (message.action === 'settingsChanged') {
                        loadSettings();
                        sendResponse({ success: true });
                    }
                } catch (error) {
                    console.error('BhashaZap: Error handling message:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            });
        }
    }

    // Handle double click
    function handleDoubleClick(e) {
        try {
            if (!isActive) {
                console.log('BhashaZap: Extension is inactive');
                return;
            }

            const target = e.target;
            const excludedTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
            const excludedClasses = ['bhashazap-popup'];
            
            if (excludedTags.includes(target.tagName) || 
                excludedClasses.some(cls => target.classList.contains(cls))) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            
            const word = getWordAtPosition(e.clientX, e.clientY);
            if (word && word.trim().length > 0 && /^[a-zA-Z]+$/.test(word.trim())) {
                console.log('BhashaZap: Translating word:', word.trim());
                showTranslation(word.trim().toLowerCase(), e.clientX, e.clientY);
            } else if (word) {
                console.log('BhashaZap: Invalid word selected:', word);
                showErrorPopup('Please select a valid English word.', e.clientX, e.clientY);
            }
        } catch (error) {
            console.error('BhashaZap: Error in handleDoubleClick:', error);
        }
    }

    // Handle click to hide popup
    function handleClick(e) {
        try {
            if (currentPopup && !currentPopup.contains(e.target)) {
                hidePopup();
            }
        } catch (error) {
            console.error('BhashaZap: Error in handleClick:', error);
        }
    }

    // Get word at position
    function getWordAtPosition(x, y) {
        try {
            const element = document.elementFromPoint(x, y);
            if (!element) return '';

            if (!element.textContent && !element.innerText) return '';

            let range = null;
            let textNode = null;
            let offset = 0;

            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(x, y);
                if (range) {
                    textNode = range.startContainer;
                    offset = range.startOffset;
                }
            }
            else if (document.caretPositionFromPoint) {
                const position = document.caretPositionFromPoint(x, y);
                if (position) {
                    textNode = position.offsetNode;
                    offset = position.offset;
                }
            }

            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                const text = element.textContent || element.innerText || '';
                const words = text.trim().split(/\s+/);
                return words.length > 0 ? words[0] : '';
            }

            const text = textNode.textContent || '';
            let start = offset;
            let end = offset;
            
            const wordRegex = /[a-zA-Z]/;
            
            while (start > 0 && wordRegex.test(text[start - 1])) {
                start--;
            }
            
            while (end < text.length && wordRegex.test(text[end])) {
                end++;
            }
            
            return text.substring(start, end);
        } catch (error) {
            console.error('BhashaZap: Error getting word at position:', error);
            return '';
        }
    }

    // Show error popup
    function showErrorPopup(message, x, y) {
        try {
            hidePopup();

            const popup = document.createElement('div');
            popup.className = 'bhashazap-popup bhashazap-error';
            
            popup.innerHTML = `
                <div class="bhashazap-header bhashazap-drag-handle">
                    <div class="bhashazap-word">BhashaZap</div>
                    <button class="bhashazap-close">×</button>
                </div>
                <div class="bhashazap-error-message">${message}</div>
                <div class="bhashazap-footer">
                    <div class="bhashazap-brand">BhashaZap 2.0.0</div>
                </div>
            `;

            positionAndShowPopup(popup, x, y);
            makeDraggable(popup);
            
            setTimeout(function() {
                if (currentPopup === popup) {
                    hidePopup();
                }
            }, 5000);
        } catch (error) {
            console.error('BhashaZap: Error showing error popup:', error);
        }
    }

    // Get offline translation
    function getOfflineTranslation(word, langCode) {
        const lowerWord = word.toLowerCase();
        return offlineDictionary[langCode] && offlineDictionary[langCode][lowerWord] 
            ? offlineDictionary[langCode][lowerWord] 
            : null;
    }

    // Show translation
    function showTranslation(word, x, y) {
        try {
            hidePopup();

            const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            const translations = {};

            // Get English definition from offline dictionary
            if (offlineDictionary.english[word]) {
                translations['en'] = offlineDictionary.english[word];
            } else {
                translations['en'] = `Definition of "${word}" not available offline.`;
            }

            // Get offline translations for selected languages
            if (selectedLanguages && selectedLanguages.length > 0) {
                selectedLanguages.forEach(langCode => {
                    const offlineTranslation = getOfflineTranslation(word, langCode);
                    if (offlineTranslation) {
                        translations[langCode] = offlineTranslation;
                    } else {
                        translations[langCode] = `Translation for "${word}" not available in ${languageNames[langCode] || langCode}.`;
                    }
                });
            }

            createTranslationPopup(capitalizedWord, translations, x, y);

        } catch (error) {
            console.error('BhashaZap: Translation process error:', error);
            showErrorPopup('Translation service temporarily unavailable.', x, y);
        }
    }

    // Create translation popup
    function createTranslationPopup(word, translations, x, y) {
        try {
            const popup = document.createElement('div');
            popup.className = 'bhashazap-popup bhashazap-draggable';
            
            let translationsHTML = '';

            // Always show English definition first
            if (translations['en']) {
                translationsHTML += `
                    <div class="bhashazap-translation" data-lang="en">
                        <div class="bhashazap-lang-name">English</div>
                        <div class="bhashazap-translation-text">${translations['en']}</div>
                    </div>
                `;
            }

            // Show translations for selected languages
            if (selectedLanguages && selectedLanguages.length > 0) {
                selectedLanguages.forEach(langCode => {
                    if (translations[langCode]) {
                        const languageName = languageNames[langCode] || langCode.toUpperCase();
                        translationsHTML += `
                            <div class="bhashazap-translation" data-lang="${langCode}">
                                <div class="bhashazap-lang-name">${languageName}</div>
                                <div class="bhashazap-translation-text">${translations[langCode]}</div>
                            </div>
                        `;
                    }
                });
            } else {
                translationsHTML += `
                    <div class="bhashazap-translation">
                        <div class="bhashazap-error-message">Select Indian languages from the extension popup to see translations.</div>
                    </div>
                `;
            }

            popup.innerHTML = `
                <div class="bhashazap-header bhashazap-drag-handle">
                    <div class="bhashazap-word">${word}</div>
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

            positionAndShowPopup(popup, x, y);
            makeDraggable(popup);
            startIncrementTimer(popup);

        } catch (error) {
            console.error('BhashaZap: Error creating translation popup:', error);
        }
    }

    // Start increment timer
    function startIncrementTimer(popup) {
        const progressBar = popup.querySelector('.bhashazap-countdown-progress');
        const timerNumber = popup.querySelector('.bhashazap-timer-number');
        if (!progressBar || !timerNumber) return;

        let timeElapsed = 0;
        const totalTime = popupDuration;
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        timerNumber.textContent = '0';
        progressBar.style.width = '0%';
        
        countdownInterval = setInterval(() => {
            timeElapsed += 0.1;
            const percentage = (timeElapsed / totalTime) * 100;
            
            if (timeElapsed >= totalTime) {
                clearInterval(countdownInterval);
                if (currentPopup === popup) {
                    hidePopup();
                }
                return;
            }
            
            progressBar.style.width = percentage + '%';
            timerNumber.textContent = Math.floor(timeElapsed);
            timerNumber.style.color = '#10b981';
            progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            
        }, 100);
    }

    // Make popup draggable
    function makeDraggable(popup) {
        const dragHandle = popup.querySelector('.bhashazap-drag-handle');
        if (!dragHandle) return;

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        function dragStart(e) {
            if (e.target.classList.contains('bhashazap-close')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                isDragging = true;
                dragHandle.style.cursor = 'grabbing';
                popup.style.userSelect = 'none';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                popup.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            dragHandle.style.cursor = 'grab';
            popup.style.userSelect = '';
        }

        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        dragHandle.style.cursor = 'grab';
    }

    // Position and show popup
    function positionAndShowPopup(popup, x, y) {
        try {
            document.body.appendChild(popup);
            currentPopup = popup;

            const popupRect = popup.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = x - popupRect.width / 2;
            let top = y - popupRect.height - 10;

            if (left < 10) {
                left = 10;
            } else if (left + popupRect.width > viewportWidth - 10) {
                left = viewportWidth - popupRect.width - 10;
            }

            if (top < 10) {
                top = y + 10;
            }

            if (top + popupRect.height > viewportHeight - 10) {
                top = viewportHeight - popupRect.height - 10;
            }

            popup.style.left = left + 'px';
            popup.style.top = top + 'px';

            const closeBtn = popup.querySelector('.bhashazap-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    hidePopup();
                });
            }

            console.log('BhashaZap: Popup shown at position:', { left, top });

        } catch (error) {
            console.error('BhashaZap: Error positioning popup:', error);
        }
    }

    // Hide current popup
    function hidePopup() {
        try {
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            if (currentPopup && currentPopup.parentNode) {
                currentPopup.parentNode.removeChild(currentPopup);
                console.log('BhashaZap: Popup hidden');
            }
            currentPopup = null;
        } catch (error) {
            console.error('BhashaZap: Error hiding popup:', error);
        }
    }

    // Listen for storage changes
    if (chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
            if (areaName === 'sync') {
                console.log('BhashaZap: Settings changed, reloading...');
                loadSettings();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('BhashaZap: Content script loaded - SYNTAX FIXED');

})();