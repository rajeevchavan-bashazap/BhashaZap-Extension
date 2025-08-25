// Content Script for BhashaZap Extension
class BhashaZapContent {
  constructor() {
    this.isActive = true;
    this.selectedLanguages = [];
    this.popupDuration = 15;
    this.currentPopup = null;
    this.isLoading = false;
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  // Load settings from storage or popup
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get({
        selectedLanguages: [],
        isExtensionActive: true,
        popupDuration: 15
      });
      
      this.selectedLanguages = result.selectedLanguages;
      this.isActive = result.isExtensionActive;
      this.popupDuration = result.popupDuration;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    document.addEventListener('click', (e) => this.handleClick(e));
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'toggleExtension') {
        this.isActive = message.isActive;
        if (!this.isActive && this.currentPopup) {
          this.hidePopup();
        }
      }
    });
  }

  // Handle double click events
  async handleDoubleClick(e) {
    if (!this.isActive || this.selectedLanguages.length === 0) {
      return;
    }

    e.preventDefault();
    
    const selectedText = this.getSelectedText();
    const word = selectedText || this.getWordAtPosition(e.clientX, e.clientY);
    
    if (word && word.trim().length > 0) {
      await this.showTranslation(word.trim(), e.clientX, e.clientY);
    }
  }

  // Handle click events (to hide popup)
  handleClick(e) {
    if (this.currentPopup && !this.currentPopup.contains(e.target)) {
      this.hidePopup();
    }
  }

  // Get selected text
  getSelectedText() {
    const selection = window.getSelection();
    return selection.toString().trim();
  }

  // Get word at mouse position
  getWordAtPosition(x, y) {
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
    
    // Find word boundaries
    let start = offset;
    let end = offset;
    
    const wordRegex = /[\w\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/;
    
    // Move start backwards
    while (start > 0 && wordRegex.test(text[start - 1])) {
      start--;
    }
    
    // Move end forwards
    while (end < text.length && wordRegex.test(text[end])) {
      end++;
    }
    
    return text.substring(start, end);
  }

  // Show translation popup
  async showTranslation(word, x, y) {
    if (this.isLoading) {
      return;
    }

    this.hidePopup();
    this.isLoading = true;

    try {
      const translations = await this.getTranslations(word);
      this.createPopup(word, translations, x, y);
    } catch (error) {
      console.error('Translation error:', error);
      this.showErrorPopup('Translation failed. Please try again.', x, y);
    } finally {
      this.isLoading = false;
    }
  }

  // Get translations for the word
  async getTranslations(word) {
    const translations = {};
    
    for (const langCode of this.selectedLanguages) {
      try {
        const translation = await this.translateWord(word, 'en', langCode);
        translations[langCode] = translation;
      } catch (error) {
        console.error(`Translation failed for ${langCode}:`, error);
        translations[langCode] = 'Translation unavailable';
      }
    }
    
    return translations;
  }

  // Translate word using API
  async translateWord(word, fromLang, toLang) {
    // Using a free translation API (MyMemory)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${fromLang}|${toLang}`;
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      } else {
        throw new Error('Translation API error');
      }
    } catch (error) {
      // Fallback: return a placeholder translation
      return `${word} (${toLang})`;
    }
  }

  // Create popup element
  createPopup(word, translations, x, y) {
    const popup = document.createElement('div');
    popup.className = 'bhashazap-popup';
    
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
    this.positionPopup(popup, x, y);
    
    // Add to page
    document.body.appendChild(popup);
    this.currentPopup = popup;

    // Setup close button
    const closeBtn = popup.querySelector('.bhashazap-close');
    closeBtn.addEventListener('click', () => this.hidePopup());

    // Auto-hide after duration
    setTimeout(() => {
      if (this.currentPopup === popup) {
        this.hidePopup();
      }
    }, this.popupDuration * 1000);
  }

  // Show error popup
  showErrorPopup(message, x, y) {
    const popup = document.createElement('div');
    popup.className = 'bhashazap-popup bhashazap-error';
    
    popup.innerHTML = `
      <div class="bhashazap-header">
        <div class="bhashazap-word">Error</div>
        <button class="bhashazap-close">×</button>
      </div>
      <div class="bhashazap-error-message">${message}</div>
    `;

    this.positionPopup(popup, x, y);
    document.body.appendChild(popup);
    this.currentPopup = popup;

    const closeBtn = popup.querySelector('.bhashazap-close');
    closeBtn.addEventListener('click', () => this.hidePopup());

    setTimeout(() => {
      if (this.currentPopup === popup) {
        this.hidePopup();
      }
    }, 3000);
  }

  // Position popup relative to click position
  positionPopup(popup, x, y) {
    popup.style.position = 'fixed';
    popup.style.zIndex = '999999';
    
    // Initial positioning
    popup.style.left = x + 'px';
    popup.style.top = (y + 10) + 'px';
    
    // Adjust if popup goes outside viewport
    setTimeout(() => {
      const rect = popup.getBoundingClientRect();
      
      if (rect.right > window.innerWidth) {
        popup.style.left = (window.innerWidth - rect.width - 10) + 'px';
      }
      
      if (rect.bottom > window.innerHeight) {
        popup.style.top = (y - rect.height - 10) + 'px';
      }
      
      if (rect.left < 0) {
        popup.style.left = '10px';
      }
      
      if (rect.top < 0) {
        popup.style.top = '10px';
      }
    }, 10);
  }

  // Hide popup
  hidePopup() {
    if (this.currentPopup) {
      this.currentPopup.remove();
      this.currentPopup = null;
    }
  }
}

// Initialize the extension when content script loads
const bhashaZap = new