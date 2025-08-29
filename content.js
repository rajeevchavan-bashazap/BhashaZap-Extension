// Enhanced Content Script for BhashaZap Extension
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

    // Initialize with retry mechanism
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

    // Load settings with error handling
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
                    selectedLanguages: selectedLanguages.length, 
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
                <div class="bhashazap-header">
                    <div class="bhashazap-word">BhashaZap</div>
                    <button class="bhashazap-close">×</button>
                </div>
                <div class="bhashazap-error-message">${message}</div>
                <div class="bhashazap-footer">
                    <div class="bhashazap-brand">BhashaZap 2.0.0</div>
                </div>
            `;

            positionAndShowPopup(popup, x, y);
            
            setTimeout(function() {
                if (currentPopup === popup) {
                    hidePopup();
                }
            }, 5000);
        } catch (error) {
            console.error('BhashaZap: Error showing error popup:', error);
        }
    }

    // Show translation with loading state
    async function showTranslation(word, x, y) {
        try {
            hidePopup();

            // Capitalize the word for display
            const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);

            // Show loading popup first
            const loadingPopup = document.createElement('div');
            loadingPopup.className = 'bhashazap-popup bhashazap-draggable';
            loadingPopup.innerHTML = `
                <div class="bhashazap-header bhashazap-drag-handle">
                    <div class="bhashazap-word">${capitalizedWord}</div>
                    <button class="bhashazap-close">×</button>
                </div>
                <div class="bhashazap-loading">Translating...</div>
                <div class="bhashazap-footer">
                    <div class="bhashazap-brand">BhashaZap 2.0.0</div>
                </div>
            `;

            positionAndShowPopup(loadingPopup, x, y);

            // Get English definition and translations
            const translations = {};
            const translationPromises = [];

            // Always get English definition first
            translationPromises.push(
                getEnglishDefinition(word)
                    .then(definition => {
                        translations['en'] = definition;
                    })
                    .catch(error => {
                        console.error('BhashaZap: English definition error:', error);
                        translations['en'] = 'Definition unavailable';
                    })
            );

            // Get translations for selected languages
            selectedLanguages.forEach(langCode => {
                translationPromises.push(
                    translateWord(word, langCode)
                        .then(translation => {
                            translations[langCode] = translation;
                        })
                        .catch(error => {
                            console.error(`BhashaZap: Translation error for ${langCode}:`, error);
                            translations[langCode] = 'Translation unavailable';
                        })
                );
            });

            await Promise.race([
                Promise.all(translationPromises),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Translation timeout')), 10000)
                )
            ]);

            if (currentPopup === loadingPopup) {
                hidePopup();
                createTranslationPopup(capitalizedWord, translations, x, y);
            }

        } catch (error) {
            console.error('BhashaZap: Translation process error:', error);
            if (currentPopup) {
                hidePopup();
                showErrorPopup('Translation service temporarily unavailable.', x, y);
            }
        }
    }

    // Get English definition (using a dictionary API)
    async function getEnglishDefinition(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
                    const firstMeaning = data[0].meanings[0];
                    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                        return firstMeaning.definitions[0].definition;
                    }
                }
            }
            
            // Fallback: just return the word with "English meaning"
            return `${word} (English meaning)`;
        } catch (error) {
            console.error('BhashaZap: Error getting English definition:', error);
            return `${word} (English meaning)`;
        }
    }

    // Translate word with improved logic for specific cases
    async function translateWord(word, toLang) {
        const maxRetries = 2;
        let lastError;

        // Special handling for known translation issues
        const corrections = {
            'north': {
                'kn': 'ಉತ್ತರ' // Correct Kannada translation for north
            }
        };

        // Check if we have a correction for this word-language pair
        if (corrections[word.toLowerCase()] && corrections[word.toLowerCase()][toLang]) {
            return corrections[word.toLowerCase()][toLang];
        }

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${toLang}`;
                
                const response = await fetch(apiUrl, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'BhashaZap Extension'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.responseStatus === 200 && 
                    data.responseData && 
                    data.responseData.translatedText &&
                    data.responseData.translatedText.toLowerCase() !== word.toLowerCase()) {
                    return data.responseData.translatedText;
                }

                throw new Error('No valid translation found');

            } catch (error) {
                lastError = error;
                console.warn(`BhashaZap: Translation attempt ${attempt + 1} failed:`, error.message);
                
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        return `${word} (${languageNames[toLang] || toLang.toUpperCase()})`;
    }

    // Create translation popup with countdown timer
    function createTranslationPopup(word, translations, x, y) {
        try {
            const popup = document.createElement('div');
            popup.className = 'bhashazap-popup bhashazap-draggable';
            
            let translationsHTML = '';

            // Always show English definition first
            if (translations['en']) {
                translationsHTML += `
                    <div class="bhashazap-translation">
                        <div class="bhashazap-lang-name">English</div>
                        <div class="bhashazap-translation-text">${translations['en']}</div>
                    </div>
                `;
            }

            // Show selected language translations
            for (const [langCode, translation] of Object.entries(translations)) {
                if (langCode !== 'en') {
                    const languageName = languageNames[langCode] || langCode.toUpperCase();
                    translationsHTML += `
                        <div class="bhashazap-translation">
                            <div class="bhashazap-lang-name">${languageName}</div>
                            <div class="bhashazap-translation-text">${translation}</div>
                        </div>
                    `;
                }
            }

            // If no languages selected, show message
            if (selectedLanguages.length === 0) {
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
                    <div class="bhashazap-countdown-bar">
                        <div class="bhashazap-countdown-progress" style="width: 100%;"></div>
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
            startCountdown(popup);

        } catch (error) {
            console.error('BhashaZap: Error creating translation popup:', error);
        }
    }

    // Start countdown timer with animation
    function startCountdown(popup) {
        const progressBar = popup.querySelector('.bhashazap-countdown-progress');
        if (!progressBar) return;

        let timeLeft = popupDuration;
        const totalTime = popupDuration;
        
        countdownInterval = setInterval(() => {
            timeLeft -= 0.1;
            const percentage = (timeLeft / totalTime) * 100;
            
            if (percentage <= 0) {
                clearInterval(countdownInterval);
                if (currentPopup === popup) {
                    hidePopup();
                }
                return;
            }
            
            progressBar.style.width = percentage + '%';
            
            // Change color as time runs out
            if (percentage <= 25) {
                progressBar.style.backgroundColor = '#ef4444';
            } else if (percentage <= 50) {
                progressBar.style.backgroundColor = '#f59e0b';
            }
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

        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.classList.contains('bhashazap-close')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                isDragging = true;
                dragHandle.style.cursor = 'grabbing';
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

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            dragHandle.style.cursor = 'grab';
        }
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

            // Set drag handle cursor
            const dragHandle = popup.querySelector('.bhashazap-drag-handle');
            if (dragHandle) {
                dragHandle.style.cursor = 'grab';
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

    console.log('BhashaZap: Enhanced content script loaded');

})();