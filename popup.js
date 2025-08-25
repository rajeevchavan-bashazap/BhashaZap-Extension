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

// DOM Elements
const languageList = document.getElementById('languageList');
const selectionCounter = document.getElementById('selectionCounter');
const remainingChanges = document.getElementById('remainingChanges');
const popupDurationSelect = document.getElementById('popupDuration');
const disableBtn = document.getElementById('disableBtn');
const statusIndicator = document.getElementById('statusIndicator');

// Initialize Extension
document.addEventListener('DOMContentLoaded', initializeExtension);

async function initializeExtension() {
  await loadSettings();
  renderLanguageList();
  updateUI();
  setupEventListeners();
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get({
      selectedLanguages: [],
      isExtensionActive: true,
      popupDuration: 15
    });
    
    selectedLanguages = result.selectedLanguages;
    isExtensionActive = result.isExtensionActive;
    popupDuration = result.popupDuration;
    
    popupDurationSelect.value = popupDuration.toString();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.sync.set({
      selectedLanguages,
      isExtensionActive,
      popupDuration
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Render language list
function renderLanguageList() {
  languageList.innerHTML = '';
  
  indianLanguages.forEach(lang => {
    const item = document.createElement('div');
    item.className = 'language-item';
    
    const isSelected = selectedLanguages.includes(lang.code);
    const isDisabled = !isSelected && selectedLanguages.length >= 2;
    
    item.innerHTML = `
      <div class="language-checkbox ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}" 
           data-lang-code="${lang.code}"></div>
      <div class="language-name">${lang.name}</div>
    `;
    
    if (!isDisabled) {
      item.addEventListener('click', () => toggleLanguage(lang.code));
    }
    
    languageList.appendChild(item);
  });
}

// Toggle language selection
function toggleLanguage(langCode) {
  if (selectedLanguages.includes(langCode)) {
    selectedLanguages = selectedLanguages.filter(code => code !== langCode);
  } else if (selectedLanguages.length < 2) {
    selectedLanguages.push(langCode);
  }
  
  renderLanguageList();
  updateUI();
  saveSettings();
}

// Update UI elements
function updateUI() {
  // Update selection counter
  selectionCounter.textContent = `${selectedLanguages.length}/2 languages selected`;
  
  // Update remaining changes
  const remaining = 2 - selectedLanguages.length;
  remainingChanges.textContent = `${remaining} language changes remaining`;
  
  // Update status indicator and disable button
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

// Setup event listeners
function setupEventListeners() {
  // Popup duration change
  popupDurationSelect.addEventListener('change', (e) => {
    popupDuration = parseInt(e.target.value);
    saveSettings();
  });
  
  // Toggle extension active state
  disableBtn.addEventListener('click', () => {
    isExtensionActive = !isExtensionActive;
    updateUI();
    saveSettings();
    
    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleExtension',
          isActive: isExtensionActive
        }).catch(() => {
          // Ignore errors if content script is not ready
        });
      }
    });
  });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    sendResponse({
      selectedLanguages,
      isExtensionActive,
      popupDuration
    });
  }
});