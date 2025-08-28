// Fixed BhashaZap Popup Script
(function() {
    'use strict';

    // Check if Chrome extension APIs are available
    if (!chrome || !chrome.storage || !chrome.storage.sync) {
        console.error('BhashaZap: Chrome extension APIs not available');
        showError('Chrome extension APIs not available. Please reload the extension.');
        return;
    }

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

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const sections = ['languageSection', 'selectedLanguagesSection', 'durationSection', 'statusSection'];
        
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.innerHTML = '<p>' + message + '</p>';
        }
        
        sections.forEach(function(sectionId) {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'none';
        });
    }

    function hideError() {
        const errorDiv = document.getElementById('errorMessage');
        const sections = ['languageSection', 'durationSection', 'statusSection'];
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        sections.forEach(function(sectionId) {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'block';
        });
    }

    function initializePopup() {
        try {
            hideError();
            loadSettingsAndRender();
            setupEventListeners();
        } catch (error) {
            console.error('BhashaZap: Error initializing popup:', error);
            showError('Failed to initialize extension popup.');
        }
    }

    function loadSettingsAndRender() {
        try {
            chrome.storage.sync.get({
                selectedLanguages: [],
                isExtensionActive: true,
                popupDuration: 15
            }, function(result) {
                if (chrome.runtime.lastError) {
                    console.error('BhashaZap: Storage error:', chrome.runtime.lastError);
                    showError('Failed to load extension settings.');
                    return;
                }

                selectedLanguages = result.selectedLanguages || [];
                isExtensionActive = result.isExtensionActive !== false;
                popupDuration = result.popupDuration || 15;

                console.log('BhashaZap: Loaded settings:', { selectedLanguages, isExtensionActive, popupDuration });

                renderLanguageList();
                updateUI();
                updateSelectedLanguagesDisplay();
            });
        } catch (error) {
            console.error('BhashaZap: Error loading settings:', error);
            showError('Failed to access extension storage.');
        }
    }

    function renderLanguageList() {
        const languageList = document.getElementById('languageList');
        if (!languageList) {
            console.error('BhashaZap: Language list element not found');
            return;
        }

        // Clear existing content
        languageList.innerHTML = '';
        console.log('BhashaZap: Rendering', LANGUAGES.length, 'languages');

        LANGUAGES.forEach(function(lang) {
            const isSelected = selectedLanguages.indexOf(lang.code) !== -1;
            const isDisabled = !isSelected && selectedLanguages.length >= 2;

            console.log('BhashaZap: Rendering', lang.name, '- Selected:', isSelected, 'Disabled:', isDisabled);

            const item = document.createElement('div');
            item.className = 'language-item';
            if (isDisabled) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
            }

            // Create checkbox
            const checkbox = document.createElement('div');
            checkbox.className = 'language-checkbox';
            if (isSelected) {
                checkbox.className += ' checked';
            }
            if (isDisabled) {
                checkbox.className += ' disabled';
            }
            checkbox.setAttribute('data-lang-code', lang.code);

            // Create language name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'language-name';
            nameDiv.textContent = lang.name;

            item.appendChild(checkbox);
            item.appendChild(nameDiv);

            // Add click handler
            if (!isDisabled) {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('BhashaZap: Clicked on', lang.name);
                    toggleLanguage(lang.code);
                });
                item.style.cursor = 'pointer';
            }

            languageList.appendChild(item);
        });

        console.log('BhashaZap: Language list rendered with', languageList.children.length, 'items');
    }

    function toggleLanguage(langCode) {
        try {
            console.log('BhashaZap: Toggling language:', langCode);
            const index = selectedLanguages.indexOf(langCode);
            
            if (index !== -1) {
                // Remove language
                selectedLanguages.splice(index, 1);
                console.log('BhashaZap: Removed', langCode, 'from selection');
            } else if (selectedLanguages.length < 2) {
                // Add language
                selectedLanguages.push(langCode);
                console.log('BhashaZap: Added', langCode, 'to selection');
            } else {
                console.log('BhashaZap: Cannot add more than 2 languages');
                return;
            }

            console.log('BhashaZap: Current selection:', selectedLanguages);
            saveSettings();
            renderLanguageList();
            updateUI();
            updateSelectedLanguagesDisplay();
        } catch (error) {
            console.error('BhashaZap: Error toggling language:', error);
        }
    }

    function updateSelectedLanguagesDisplay() {
        const selectedSection = document.getElementById('selectedLanguagesSection');
        const selectedContainer = document.getElementById('selectedLanguages');
        
        if (!selectedSection || !selectedContainer) return;

        if (selectedLanguages.length > 0) {
            selectedSection.style.display = 'block';
            selectedContainer.innerHTML = '';

            selectedLanguages.forEach(function(langCode) {
                const lang = LANGUAGES.find(function(l) { return l.code === langCode; });
                if (lang) {
                    const langItem = document.createElement('div');
                    langItem.className = 'lang-item';
                    langItem.style.display = 'flex';
                    langItem.style.alignItems = 'center';
                    langItem.style.gap = '8px';
                    langItem.style.marginBottom = '4px';
                    
                    const langCodeSpan = document.createElement('span');
                    langCodeSpan.className = 'lang-code';
                    langCodeSpan.textContent = lang.code.toUpperCase();
                    
                    const langName = document.createElement('span');
                    langName.textContent = lang.name;
                    
                    langItem.appendChild(langCodeSpan);
                    langItem.appendChild(langName);
                    selectedContainer.appendChild(langItem);
                }
            });
        } else {
            selectedSection.style.display = 'none';
        }
    }

    function updateUI() {
        try {
            // Update selection counter
            const selectionCounter = document.getElementById('selectionCounter');
            if (selectionCounter) {
                selectionCounter.textContent = selectedLanguages.length + '/2 languages selected';
            }

            // Update remaining changes
            const remainingChanges = document.getElementById('remainingChanges');
            if (remainingChanges) {
                const remaining = 2 - selectedLanguages.length;
                if (remaining > 0) {
                    remainingChanges.textContent = remaining + ' more language' + (remaining !== 1 ? 's' : '') + ' can be selected';
                } else {
                    remainingChanges.textContent = 'Maximum languages selected. Uncheck to change.';
                }
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
                    disableBtn.className = 'disable-btn';
                    disableBtn.style.background = '';
                } else {
                    statusIndicator.textContent = 'Extension is Disabled';
                    statusIndicator.className = 'status-inactive';
                    disableBtn.textContent = 'Enable Extension';
                    disableBtn.className = 'disable-btn';
                    disableBtn.style.background = '#10B981';
                }
            }
        } catch (error) {
            console.error('BhashaZap: Error updating UI:', error);
        }
    }

    function saveSettings() {
        try {
            console.log('BhashaZap: Saving settings:', { selectedLanguages, isExtensionActive, popupDuration });
            chrome.storage.sync.set({
                selectedLanguages: selectedLanguages,
                isExtensionActive: isExtensionActive,
                popupDuration: popupDuration
            }, function() {
                if (chrome.runtime.lastError) {
                    console.error('BhashaZap: Error saving settings:', chrome.runtime.lastError);
                } else {
                    console.log('BhashaZap: Settings saved successfully');
                }
            });
        } catch (error) {
            console.error('BhashaZap: Error in saveSettings:', error);
        }
    }

    function setupEventListeners() {
        try {
            // Popup duration selector
            const popupDurationSelect = document.getElementById('popupDuration');
            if (popupDurationSelect) {
                popupDurationSelect.addEventListener('change', function(e) {
                    popupDuration = parseInt(e.target.value, 10);
                    console.log('BhashaZap: Changed popup duration to:', popupDuration);
                    saveSettings();
                });
            }

            // Disable/Enable button
            const disableBtn = document.getElementById('disableBtn');
            if (disableBtn) {
                disableBtn.addEventListener('click', function() {
                    isExtensionActive = !isExtensionActive;
                    console.log('BhashaZap: Extension toggled to:', isExtensionActive);
                    updateUI();
                    saveSettings();

                    // Notify content script
                    try {
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                            if (tabs && tabs[0] && tabs[0].id) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: 'toggleExtension',
                                    isActive: isExtensionActive
                                }, function(response) {
                                    if (chrome.runtime.lastError) {
                                        console.log('BhashaZap: Could not send message to content script:', chrome.runtime.lastError.message);
                                    } else {
                                        console.log('BhashaZap: Notified content script about toggle');
                                    }
                                });
                            }
                        });
                    } catch (error) {
                        console.error('BhashaZap: Error notifying content script:', error);
                    }
                });
            }
        } catch (error) {
            console.error('BhashaZap: Error setting up event listeners:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePopup);
    } else {
        // DOM is already ready
        initializePopup();
    }

    console.log('BhashaZap: Popup script loaded');

})();