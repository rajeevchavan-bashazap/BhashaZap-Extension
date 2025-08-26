// Simple Content Script for BhashaZap Extension
(function() {
    'use strict';

    // Extension state
    let isActive = true;
    let selectedLanguages = [];
    let popupDuration = 15;
    let currentPopup = null;

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

    // Initialize
    function init() {
        loadSettings();
        setupEventListeners();
    }

    // Load settings
    function loadSettings() {
        chrome.storage.sync.get({
            selectedLanguages: [],
            isExtensionActive: true,
            popupDuration: 15
        }, function(result) {
            selectedLanguages = result.selectedLanguages;
            isActive = result.isExtensionActive;
            popupDuration = result.popupDuration;
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        document.addEventListener('dblclick', handleDoubleClick);
        document.addEventListener('click', handleClick);

        // Listen for messages
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            if (message.action === 'toggleExtension') {
                isActive = message.isActive;
                if (!isActive && currentPopup) {
                    hidePopup();
                }
            }
        });
    }

    // Handle double click
    function handleDoubleClick(e) {
        if (!isActive || selectedLanguages.length === 0) {
            return;
        }

        e.preventDefault();
        
        const word = getWordAtPosition(e.clientX, e.clientY);
        if (word && word.trim().length > 0) {
            showTranslation(word.trim(), e.clientX, e.clientY);
        }
    }

    // Handle click to hide popup
    function handleClick(e) {
        if (currentPopup && !currentPopup.contains(e.target)) {
            hidePopup();
        }
    }

    // Get word at position
    function getWordAtPosition(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element || !element.textContent) {
            return '';
        }

        const range = document.caretRangeFromPoint(x, y);
        if (!range) {
            return '';
        }

        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) {
            return '';
        }

        const text = textNode.textContent;
        const offset = range.startOffset;
        
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
    }

    // Show translation
    async function showTranslation(word, x, y) {
        hidePopup();

        const translations = {};
        
        // Get translations for each selected language
        for (const langCode of selectedLanguages) {
            try {
                const translation = await translateWord(word, langCode);
                translations[langCode] = translation;
            } catch (error) {
                translations[langCode] = 'Translation unavailable';
            }
        }

        createPopup(word, translations, x, y);
    }

    // Translate word
    async function translateWord(word, toLang) {
        try {
            const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${toLang}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.responseStatus === 200 && data.responseData) {
                return data.responseData.translatedText;
            } else {
                return `${word} (${toLang})`;
            }
        } catch (error) {
            return `${word} (${toLang})`;
        }
    }

    // Create popup
    function createPopup(word, translations, x, y) {
        const popup = document.createElement('div');
        popup.className = 'bhashazap-popup';
        
        let translationsHTML = '';
        for (const [langCode, translation] of Object.entries(translations)) {
            const languageName = languageNames[langCode] || langCode.toUpperCase();
            translationsHTML += `
                <div class="bhashazap-translation">
                    <div class="bhashazap-lang-name">${languageName}</div>
                    <div class="bhashazap-translation-text">${translation}</div>
                </div>
            `;
        }

        popup.innerHTML = `
            <div class="bhashazap-header">
                <div class="bhashazap-word">${word}</div>
                <button class="bhashazap-close">×</button>
            </div>
            <div class="bhashazap-translations">
                ${translationsHTML}
            </div>
            <div class="bhashazap-footer">
                <div class="bhashazap-brand">BhashaZap</div>
            </div>
        `;

        // Position popup
        popup.style.position = 'fixed';
        popup.style.left = x + 'px';
        popup.style.top = (y + 10) + 'px';
        popup.style.zIndex = '999999';
        
        document.body.appendChild(popup);
        currentPopup = popup;

        // Setup close button
        const closeBtn = popup.querySelector('.bhashazap-close');
        closeBtn.addEventListener('click', hidePopup);

        // Auto-hide
        setTimeout(function() {
            if (currentPopup === popup) {
                hidePopup();
            }
        }, popupDuration * 1000);

        // Adjust position if needed
        setTimeout(function() {
            const rect = popup.getBoundingClientRect();
            
            if (rect.right > window.innerWidth) {
                popup.style.left = (window.innerWidth - rect.width - 10) + 'px';
            }
            
            if (rect.bottom > window.innerHeight) {
                popup.style.top = (y - rect.height - 10) + 'px';
            }
        }, 10);
    }

    // Hide popup
    function hidePopup() {
        if (currentPopup) {
            currentPopup.remove();
            currentPopup = null;
        }
    }

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();