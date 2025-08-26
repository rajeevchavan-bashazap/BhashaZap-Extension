// Indian Languages Data
const indianLanguages = [
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

// Global State
let selectedLanguages = [];
let isExtensionActive = true;
let popupDuration = 15;

// DOM Elements (will be set after DOM loads)
let languageList;
let selectionCounter;
let remainingChanges;
let popupDurationSelect;
let disableBtn;
let statusIndicator;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing extension...');
  
  // Get DOM elements
  languageList = document.getElementById('languageList');
  selectionCounter = document.getElementById('selectionCounter');
  remainingChanges = document.getElementById('remainingChanges');
  popupDurationSelect = document.getElementById('popupDuration');
  disableBtn = document.getElementById('disableBtn');
  statusIndicator = document.getElementById('statusIndicator');
  
  // Check if elements exist
  if (!languageList) {
    console.error('languageList element not found');
    return;
  }
  
  console.log('Elements found, proceeding with initialization...');
  
  initializeExtension();
});

async function initializeExtension() {
  console.log('Starting initialization...');
  try {
    await loadSettings();
    renderLanguageList();
    updateUI();
    setupEventListeners();
    console.log('Initialization complete');
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Load settings from storage
async function loadSettings() {
  console.log('Loading settings...');
  try {
    // Use chrome.storage.sync.get with callback for better compatibility
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        selectedLanguages: [],
        isExtensionActive: true,
        popupDuration: 15
      }, function(result) {
        console.log('Settings loaded:', result);
        selectedLanguages = result.selectedLanguages;
        isExtensionActive = result.isExtensionActive;
        popupDuration = result.popupDuration;
        
        if (popupDurationSelect) {
          popupDurationSelect.value = popupDuration.toString();
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    // Use defaults
    selectedLanguages = [];
    isExtensionActive = true;
    popupDuration = 15;
  }
}

// Save settings to storage
function saveSettings() {
  console.log('Saving settings...', { selectedLanguages, isExtensionActive, popupDuration });
  try {
    chrome.storage.sync.set({
      selectedLanguages: selectedLanguages,
      isExtensionActive: isExtensionActive,
      popupDuration: popupDuration
    }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
      } else {
        console.log('Settings saved successfully');
      }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Render language list
function renderLanguageList() {
  console.log('Rendering language list...');
  
  if (!languageList) {
    console.error('languageList element not found');
    return;
  }
  
  languageList.innerHTML = '';
  
  indianLanguages.forEach(function(lang) {
    const item = document.createElement('div');
    item.className = 'language-item';
    
    const isSelected = selectedLanguages.includes(lang.code);
    const isDisabled = !isSelected && selectedLanguages.length >= 2;
    
    const checkboxClass = `language-checkbox ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}`;
    
    item.innerHTML = `
      <div class="${checkboxClass}" data-lang-code="${lang.code}"></div>
      <div class="language-name">${lang.name}</div>
    `;
    
    // Add click handler if not disabled
    if (!isDisabled) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function() {
        console.log('Language clicked:', lang.code);
        toggleLanguage(lang.code);
      });
    } else {
      item.style.cursor = 'not-allowed';
      item.style.opacity = '0.5';
    }
    
    languageList.appendChild(item);
  });
  
  console.log('Language list rendered with', indianLanguages.length, 'languages');
}

// Toggle language selection
function toggleLanguage(langCode) {
  console.log('Toggling language:', langCode);
  
  if (selectedLanguages.includes(langCode)) {
    // Remove language
    selectedLanguages = selectedLanguages.filter(function(code) {
      return code !== langCode;
    });
    console.log('Language removed:', langCode);
  } else if (selectedLanguages.length < 2) {
    // Add language
    selectedLanguages.push(langCode);
    console.log('Language added:', langCode);
  }
  
  console.log('Selected languages:', selectedLanguages);
  
  renderLanguageList();
  updateUI();
  saveSettings();
}

// Update UI elements
function updateUI() {
  console.log('Updating UI...');
  
  // Update selection counter
  if (selectionCounter) {
    selectionCounter.textContent = `${selectedLanguages.length}/2 languages selected`;
  }
  
  // Update remaining changes
  if (remainingChanges) {
    const remaining = 2 - selectedLanguages.length;
    remainingChanges.textContent = `${remaining} language changes remaining`;
  }
  
  // Update status indicator and disable button
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
  
  console.log('UI updated');
}

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Popup duration change
  if (popupDurationSelect) {
    popupDurationSelect.addEventListener('change', function(e) {
      popupDuration = parseInt(e.target.value);
      console.log('Popup duration changed to:', popupDuration);
      saveSettings();
    });
  }
  
  // Toggle extension active state
  if (disableBtn) {
    disableBtn.addEventListener('click', function() {
      isExtensionActive = !isExtensionActive;
      console.log('Extension active state changed to:', isExtensionActive);
      updateUI();
      saveSettings();
      
      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleExtension',
            isActive: isExtensionActive
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Could not send message to content script:', chrome.runtime.lastError);
            }
          });
        }
      });
    });
  }
  
  console.log('Event listeners set up');
}

// Handle runtime messages
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'getSettings') {
    sendResponse({
      selectedLanguages: selectedLanguages,
      isExtensionActive: isExtensionActive,
      popupDuration: popupDuration
    });
  }
});