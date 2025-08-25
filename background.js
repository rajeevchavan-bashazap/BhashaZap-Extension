// Background Script for BhashaZap Extension

// Initialize extension when installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      selectedLanguages: [],
      isExtensionActive: true,
      popupDuration: 15
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'BhashaZap Installed!',
      message: 'Double-click any word to see its translation in Indian languages.'
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (default behavior)
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    // Get settings from storage and send back
    chrome.storage.sync.get({
      selectedLanguages: [],
      isExtensionActive: true,
      popupDuration: 15
    }).then((result) => {
      sendResponse(result);
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
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

// Handle translation requests
async function handleTranslation(word, fromLang, toLang) {
  try {
    // Using MyMemory Translation API (free tier)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${fromLang}|${toLang}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    } else {
      throw new Error('Translation API returned an error');
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Return fallback translation
    return `${word} (${toLang})`;
  }
}

// Monitor storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    // Notify all tabs about settings change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsChanged',
          changes
        }).catch(() => {
          // Ignore errors for tabs without content script
        });
      });
    });
  }
});

// Handle context menu (optional feature)
chrome.contextMenus.create({
  id: 'translateSelection',
  title: 'Translate with BhashaZap',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translateSelection' && info.selectionText) {
    // Send translation request to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'translateSelection',
      text: info.selectionText
    }).catch(() => {
      console.error('Could not send message to content script');
    });
  }
});

// Cleanup on extension suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log('BhashaZap extension is being suspended');
});

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('BhashaZap update available:', details.version);
  // You can choose to reload immediately or notify user
  // chrome.runtime.reload();
});

// Error handling
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.error('Port disconnected:', chrome.runtime.lastError);
    }
  });
});