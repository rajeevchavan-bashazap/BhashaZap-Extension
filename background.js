// Fixed Background Script for BhashaZap Extension (Manifest V3)

// Initialize extension when installed
chrome.runtime.onInstalled.addListener((details) => {
  console.log('BhashaZap: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings
    try {
      chrome.storage.sync.set({
        selectedLanguages: [], // Empty by default - user must select from popup
        isExtensionActive: true,
        popupDuration: 15
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('BhashaZap: Error setting default settings:', chrome.runtime.lastError);
        } else {
          console.log('BhashaZap: Default settings initialized');
        }
      });
    } catch (error) {
      console.error('BhashaZap: Error during installation:', error);
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('BhashaZap: Received message:', message);
  
  try {
    if (message.action === 'getSettings') {
      // Get settings from storage and send back
      chrome.storage.sync.get({
        selectedLanguages: ['kannada', 'telugu'], // Default Indian languages
        isExtensionActive: true,
        popupDuration: 15
      }, (result) => {
        if (chrome.runtime.lastError) {
          console.error('BhashaZap: Error getting settings:', chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
            selectedLanguages: ['kannada', 'telugu'],
            isExtensionActive: true,
            popupDuration: 15
          });
        } else {
          console.log('BhashaZap: Settings retrieved:', result);
          // Always include English along with selected Indian languages
          const allLanguages = ['english'].concat(result.selectedLanguages);
          sendResponse({
            success: true,
            selectedLanguages: allLanguages,
            isExtensionActive: result.isExtensionActive,
            popupDuration: result.popupDuration
          });
        }
      });
      return true; // Keep message channel open for async response
    }
    
    if (message.action === 'translateWord') {
      // Handle translation request
      handleTranslation(message.word, message.fromLang, message.toLang)
        .then(translation => {
          sendResponse({ success: true, translation });
        })
        .catch(error => {
          console.error('BhashaZap: Translation error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
    }

    if (message.action === 'updateSettings') {
      // Handle settings update
      chrome.storage.sync.set(message.settings, () => {
        if (chrome.runtime.lastError) {
          console.error('BhashaZap: Error updating settings:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('BhashaZap: Settings updated:', message.settings);
          sendResponse({ success: true });
        }
      });
      return true;
    }
    
    // Handle other message types
    sendResponse({ success: false, error: 'Unknown action: ' + message.action });
    
  } catch (error) {
    console.error('BhashaZap: Error in message handler:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});

// Handle translation requests
async function handleTranslation(word, fromLang, toLang) {
  try {
    console.log(`BhashaZap: Translating "${word}" from ${fromLang} to ${toLang}`);
    
    // Using MyMemory Translation API (free tier)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${fromLang}|${toLang}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BhashaZap Chrome Extension'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      const translation = data.responseData.translatedText;
      console.log(`BhashaZap: Translation result: "${translation}"`);
      return translation;
    } else {
      throw new Error('Translation API returned invalid response');
    }
  } catch (error) {
    console.error('BhashaZap: Translation error:', error);
    // Return fallback translation
    return `${word} (${toLang})`;
  }
}

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
        // Skip chrome:// and extension pages
        if (tab.url && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('chrome-extension://') &&
            !tab.url.startsWith('moz-extension://')) {
          
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsChanged',
            changes
          }).catch((error) => {
            // Ignore errors for tabs without content script
            console.log(`BhashaZap: Could not notify tab ${tab.id}:`, error.message);
          });
        }
      });
    });
  }
});

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('BhashaZap: Update available:', details.version);
  // Auto-reload after 5 seconds to apply update
  setTimeout(() => {
    chrome.runtime.reload();
  }, 5000);
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
  console.log('BhashaZap: Extension started');
});

// Keep service worker alive (Manifest V3 requirement)
chrome.runtime.onConnect.addListener((port) => {
  console.log('BhashaZap: Port connected:', port.name);
  
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.log('BhashaZap: Port disconnected with error:', chrome.runtime.lastError);
    } else {
      console.log('BhashaZap: Port disconnected normally');
    }
  });
});

// Error handling for uncaught exceptions
self.addEventListener('error', (event) => {
  console.error('BhashaZap: Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('BhashaZap: Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('BhashaZap: Background script loaded successfully');