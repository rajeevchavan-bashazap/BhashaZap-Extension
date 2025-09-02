// BhashaZap Background Script (Service Worker)
chrome.runtime.onInstalled.addListener((details) => {
  console.log('BhashaZap: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      selectedLanguages: ['kn', 'mr'], // Default to Kannada and Marathi
      isExtensionActive: true,
      popupDuration: 15
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('BhashaZap: Error setting default settings:', chrome.runtime.lastError);
      } else {
        console.log('BhashaZap: Default settings initialized');
      }
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('BhashaZap: Received message:', message);
  
  if (message.action === 'getSettings') {
    // Get settings from storage and send back
    chrome.storage.sync.get({
      selectedLanguages: ['kn', 'mr'],
      isExtensionActive: true,
      popupDuration: 15
    }, (result) => {
      if (chrome.runtime.lastError) {
        console.error('BhashaZap: Error getting settings:', chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
          selectedLanguages: ['kn', 'mr'],
          isExtensionActive: true,
          popupDuration: 15
        });
      } else {
        console.log('BhashaZap: Settings retrieved:', result);
        sendResponse({
          success: true,
          ...result
        });
      }
    });
    return true; // Keep message channel open for async response
  }
  
  sendResponse({ success: false, error: 'Unknown action: ' + message.action });
  return true;
});

// Monitor storage changes and notify content scripts
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('BhashaZap: Settings changed:', changes);
    
    // Notify all tabs about settings change
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('BhashaZap: Error querying tabs:', chrome.runtime.lastError);
        return;
      }
      
      tabs.forEach(tab => {
        if (tab.url && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('chrome-extension://') &&
            !tab.url.startsWith('moz-extension://')) {
          
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsChanged',
            changes
          }).catch((error) => {
            console.log(`BhashaZap: Could not notify tab ${tab.id}:`, error.message);
          });
        }
      });
    });
  }
});

console.log('BhashaZap: Background script loaded successfully');