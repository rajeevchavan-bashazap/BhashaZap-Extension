// Safe Content Script for BhashaZap Extension
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
            // Retry after 1 second
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
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('dblclick', handleDoubleClick, true);
        document.removeEventListener('click', handleClick, true);
        
        // Add new listeners
        document.addEventListener('dblclick', handleDoubleClick, true);
        document.addEventListener('click', handleClick, true);

        // Listen for messages from popup and background
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

    // Handle double click with comprehensive error handling
    function handleDoubleClick(e) {
        try {
            if (!isActive) {
                console.log('BhashaZap: Extension is inactive');
                return;
            }

            if (selectedLanguages.length === 0) {
                console.log('BhashaZap: No languages selected');
                showErrorPopup('Please select Indian languages in the BhashaZap extension popup first.', e.clientX, e.clientY);
                return;
            }

            // Check if click is on excluded elements
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
                showTranslation(word.trim(), e.clientX, e.clientY);
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

    // Get word at position with improved error handling
    function getWordAtPosition(x, y) {
        try {
            const element = document.elementFromPoint(x, y);
            if (!element) return '';

            // Skip if element has no text content
            if (!element.textContent && !element.innerText) return '';

            // Handle different selection methods
            let range = null;
            let textNode = null;
            let offset = 0;

            // Try caretRangeFromPoint first (most browsers)
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(x, y);
                if (range) {
                    textNode = range.startContainer;
                    offset = range.startOffset;
                }
            }
            // Fallback to caretPositionFromPoint (Firefox)
            else if (document.caretPositionFromPoint) {
                const position = document.caretPositionFromPoint(x, y);
                if (position) {
                    textNode = position.offsetNode;
                    offset = position.offset;
                }
            }

            // If we couldn't get precise position, use element text
            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                const text = element.textContent || element.innerText || '';
                const words = text.trim().split(/\s+/);
                return words.length > 0 ? words[0] : '';
            }

            const text = textNode.textContent || '';
            let start = offset;
            let end = offset;
            
            const wordRegex = /[a-zA-Z]/;
            
            // Find start of word
            while (start > 0 && wordRegex.test(text[start - 1])) {
                start--;
            }
            
            // Find end of word
            while (end < text.length && wordRegex.test(text[end])) {
                end++;
            }
            
            return text.substring(start, end);
        } catch (error) {
            console.error('BhashaZap: Error getting word at position:', error);
            return '';
        }
    }

    // Show error popup with timeout
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
                    <div class="bhashazap-brand">BhashaZap Extension</div>
                </div>
            `;

            positionAndShowPopup(popup, x, y);
            
            // Auto-hide after 5 seconds
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

            // Show loading popup first
            const loadingPopup = document.createElement('div');
            loadingPopup.className = 'bhashazap-popup';
            loadingPopup.innerHTML = `
                <div class="bhashazap-header">
                    <div class="bhashazap-word">${word}</div>
                    <button class="bhashazap-close">×</button>
                </div>
                <div class="bhashazap-loading">Translating...</div>
                <div class="bhashazap-footer">
                    <div class="bhashazap-brand">BhashaZap Extension</div>
                </div>
            `;

            positionAndShowPopup(loadingPopup, x, y);

            const translations = {};
            const translationPromises = [];
            
            // Create translation promises
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

            // Wait for all translations with timeout
            await Promise.race([
                Promise.all(translationPromises),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Translation timeout')), 10000)
                )
            ]);

            // Hide loading popup and show results
            if (currentPopup === loadingPopup) {
                hidePopup();
                createTranslationPopup(word, translations, x, y);
            }

        } catch (error) {
            console.error('BhashaZap: Translation process error:', error);
            if (currentPopup) {
                hidePopup();
                showErrorPopup('Translation service temporarily unavailable.', x, y);
            }
        }
    }

    // Translate word with fallback mechanism
    async function translateWord(word, toLang) {
        const maxRetries = 2;
        let lastError;

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
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        // Return fallback if all attempts failed
        return `${word} (${languageNames[toLang] || toLang.toUpperCase()})`;
    }

    // Create translation popup
    function createTranslationPopup(word, translations, x, y) {
        try {
            const popup = document.createElement('div');
            popup.className = 'bhashazap-popup';
            
            let translationsHTML = '';
            let hasValidTranslations = false;

            for (const [langCode, translation] of Object.entries(translations)) {
                const languageName = languageNames[langCode] || langCode.toUpperCase();
                const isValid = translation !== 'Translation unavailable' && 
                               translation !== `${word} (${languageName})`;
                
                if (isValid) hasValidTranslations = true;
                
                translationsHTML += `
                    <div class="bhashazap-translation">
                        <div class="bhashazap-lang-name">${languageName}</div>
                        <div class="bhashazap-translation-text">${translation}</div>
                    </div>
                `;
            }

            if (!hasValidTranslations) {
                translationsHTML = `
                    <div class="bhashazap-translation">
                        <div class="bhashazap-error-message