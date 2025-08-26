// CSP-compliant popup script
(function() {
    'use strict';

    const LANGUAGES = [
        { code: 'hi', name: 'Hindi' },
        { code: 'bn', name: 'Bengali' },
        { code: 'te', name: 'Telugu' },
        { code: 'mr', name: 'Marathi' },
        { code: 'ta', name: 'Tamil' },
        { code: 'ur', name: 'Urdu' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'kn', name: 'Kannada' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'pa', name: 'Punjabi' }
    ];

    let selectedLanguages = [];
    let isExtensionActive = true;
    let popupDuration = 15;

    function initializePopup() {
        loadSettingsAndRender();
        setupEventListeners();
    }

    function loadSettingsAndRender() {
        chrome.storage.sync.get({
            selectedLanguages: [],
            isExtensionActive: true,
            popupDuration: 15
        }, function(result) {
            selectedLanguages = result.selectedLanguages;
            isExtensionActive = result.isExtensionActive;
            popupDuration = result.popupDuration;

            renderLanguageList();
            updateUI();
        });
    }

    function renderLanguageList() {
        const languageList = document.getElementById('languageList');
        if (!languageList) return;

        // Clear existing content
        while (languageList.firstChild) {
            languageList.removeChild(languageList.firstChild);
        }

        LANGUAGES.forEach(function(lang) {
            const isSelected = selectedLanguages.indexOf(lang.code) !== -1;
            const isDisabled = !isSelected && selectedLanguages.length >= 2;

            const item = document.createElement('div');
            item.className = 'language-item';

            const checkbox = document.createElement('div');
            checkbox.className = 'language-checkbox';
            if (isSelected) {
                checkbox.className += ' checked';
            }
            if (isDisabled) {
                checkbox.className += ' disabled';
            }
            checkbox.setAttribute('data-lang-code', lang.code);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'language-name';
            nameDiv.textContent = lang.name;

            item.appendChild(checkbox);
            item.appendChild(nameDiv);

            if (!isDisabled) {
                item.addEventListener('click', createLanguageClickHandler(lang.code));
            }

            languageList.appendChild(item);
        });
    }

    function createLanguageClickHandler(langCode) {
        return function() {
            toggleLanguage(langCode);
        };
    }

    function toggleLanguage(langCode) {
        const index = selectedLanguages.indexOf(langCode);
        
        if (index !== -1) {
            // Remove language
            selectedLanguages.splice(index, 1);
        } else if (selectedLanguages.length < 2) {
            // Add language
            selectedLanguages.push(langCode);
        }

        saveSettings();
        renderLanguageList();
        updateUI();
    }

    function updateUI() {
        // Update selection counter
        const selectionCounter = document.getElementById('selectionCounter');
        if (selectionCounter) {
            selectionCounter.textContent = selectedLanguages.length + '/2 languages selected';
        }

        // Update remaining changes
        const remainingChanges = document.getElementById('remainingChanges');
        if (remainingChanges) {
            const remaining = 2 - selectedLanguages.length;
            remainingChanges.textContent = remaining + ' language changes remaining';
        }

        // Update popup duration
        const popupDurationSelect = document.getElementById('popupDuration');
        if (popupDurationSelect) {
            popupDurationSelect.value = popupDuration.toString();
        }

        // Update status and button
        const statusIndicator = document.getElementById('statusIndicator');
        const disableBtn = document.getElementById('disableBtn');

        if (statusIndicator && disableBtn) {
            if (isExtensionActive) {
                statusIndicator.textContent = 'Extension is Active';
                statusIndicator.className = 'status-active';
                disableBtn.textContent = 'Disable Extension';
            } else {
                statusIndicator.textContent = 'Extension is Disabled';
                statusIndicator.className = 'status-inactive';
                disableBtn.textContent = 'Enable Extension';
            }
        }
    }

    function saveSettings() {
        chrome.storage.sync.set({
            selectedLanguages: selectedLanguages,
            isExtensionActive: isExtensionActive,
            popupDuration: popupDuration
        });
    }

    function setupEventListeners() {
        // Popup duration selector
        const popupDurationSelect = document.getElementById('popupDuration');
        if (popupDurationSelect) {
            popupDurationSelect.addEventListener('change', function(e) {
                popupDuration = parseInt(e.target.value, 10);
                saveSettings();
            });
        }

        // Disable/Enable button
        const disableBtn = document.getElementById('disableBtn');
        if (disableBtn) {
            disableBtn.addEventListener('click', function() {
                isExtensionActive = !isExtensionActive;
                updateUI();
                saveSettings();

                // Notify content script
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'toggleExtension',
                            isActive: isExtensionActive
                        }).catch(function() {
                            // Ignore errors if content script not available
                        });
                    }
                });
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePopup);
    } else {
        initializePopup();
    }

})();