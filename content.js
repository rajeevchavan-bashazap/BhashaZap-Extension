// BhashaZap - Working Version (Bypass Settings)
console.log('BhashaZap: Loading working version...');

class BhashaZapWorking {
    constructor() {
        this.popup = null;
        this.timerInterval = null;
        this.currentTimer = 0;
        this.popupDuration = 15;
        this.init();
    }

    init() {
        this.createPopup();
        this.addEventListeners();
        console.log('BhashaZap: Working version ready');
    }

    createPopup() {
        const existing = document.getElementById('bhashazap-working-popup');
        if (existing) existing.remove();

        this.popup = document.createElement('div');
        this.popup.id = 'bhashazap-working-popup';
        this.popup.innerHTML = `
            <div class="header">
                <span class="word" id="word-title">Word</span>
                <span class="version">BhashaZap 2.0.0</span>
                <button class="close" onclick="document.getElementById('bhashazap-working-popup').style.display='none'">×</button>
            </div>
            <div class="timer" id="timer-section">
                <div class="timer-info">
                    <span class="count" id="timer-count">0</span>
                    <span class="text" id="timer-text">Auto-close in 15s</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
            </div>
            <div class="content" id="content-area">
                <div class="loading">Loading definitions...</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #bhashazap-working-popup {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 6px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, sans-serif;
                width: 320px;
                max-height: 350px;
                overflow: hidden;
            }
            #bhashazap-working-popup .header {
                background: rgba(255,255,255,0.1);
                color: white;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            #bhashazap-working-popup .word {
                font-size: 15px;
                font-weight: bold;
                flex: 1;
                text-transform: capitalize;
            }
            #bhashazap-working-popup .version {
                font-size: 9px;
                margin-right: 8px;
                background: rgba(255,255,255,0.1);
                padding: 1px 4px;
                border-radius: 6px;
            }
            #bhashazap-working-popup .close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 50%;
            }
            #bhashazap-working-popup .close:hover {
                background: rgba(255,255,255,0.2);
            }
            #bhashazap-working-popup .timer {
                background: rgba(255,255,255,0.05);
                padding: 4px 12px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            #bhashazap-working-popup .timer-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 3px;
            }
            #bhashazap-working-popup .count {
                color: #4ade80;
                font-size: 11px;
                font-weight: bold;
            }
            #bhashazap-working-popup .text {
                color: white;
                font-size: 9px;
            }
            #bhashazap-working-popup .progress-bar {
                width: 100%;
                height: 2px;
                background: rgba(255,255,255,0.2);
                border-radius: 1px;
                overflow: hidden;
            }
            #bhashazap-working-popup .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
                width: 100%;
                transition: width 0.9s ease-out;
            }
            #bhashazap-working-popup .content {
                background: white;
                max-height: 250px;
                overflow-y: auto;
                padding: 0;
            }
            #bhashazap-working-popup .loading {
                padding: 12px;
                text-align: center;
                color: #666;
                font-size: 12px;
                font-style: italic;
            }
            #bhashazap-working-popup .section {
                padding: 6px 12px;
                border-bottom: 1px solid #f0f0f0;
            }
            #bhashazap-working-popup .section:last-child {
                border-bottom: none;
            }
            #bhashazap-working-popup .lang-header {
                font-weight: bold;
                color: #667eea;
                font-size: 11px;
                margin-bottom: 4px;
            }
            #bhashazap-working-popup .definition {
                color: #333;
                line-height: 1.3;
                font-size: 12px;
                margin-bottom: 2px;
            }
            #bhashazap-working-popup .phonetic {
                color: #666;
                font-style: italic;
                font-size: 10px;
                margin-bottom: 3px;
            }
            #bhashazap-working-popup .part-speech {
                background: #f0f4ff;
                color: #667eea;
                padding: 1px 4px;
                border-radius: 6px;
                font-size: 9px;
                font-weight: bold;
                text-transform: uppercase;
                display: inline-block;
                margin-bottom: 3px;
                margin-right: 3px;
            }
            #bhashazap-working-popup .example {
                background: #f8f9fa;
                border-left: 2px solid #667eea;
                padding: 3px 6px;
                margin: 3px 0;
                font-style: italic;
                color: #555;
                font-size: 11px;
                border-radius: 0 2px 2px 0;
            }
            #bhashazap-working-popup .no-def {
                color: #6c757d;
                text-align: center;
                padding: 8px;
                font-style: italic;
                font-size: 12px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.popup);
    }

    addEventListeners() {
        document.addEventListener('dblclick', (e) => {
            const selectedText = window.getSelection().toString().trim();
            let word = selectedText;
            
            if (!word) {
                const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
                    const text = range.startContainer.textContent;
                    const offset = range.startOffset;
                    let start = offset, end = offset;
                    while (start > 0 && /\w/.test(text[start - 1])) start--;
                    while (end < text.length && /\w/.test(text[end])) end++;
                    word = text.substring(start, end).trim();
                }
            }
            
            if (word && word.length > 1) {
                this.handleWord(word);
            }
        });
    }

    async handleWord(word) {
        console.log('BhashaZap: Handling word:', word);
        
        this.popup.style.display = 'block';
        document.getElementById('word-title').textContent = word;
        document.getElementById('content-area').innerHTML = '<div class="loading">Fetching definitions...</div>';
        
        this.startTimer();
        
        // Define languages to fetch
        const languages = [
            { code: 'kannada', name: 'ಕನ್ನಡ (KANNADA)', apiCode: 'kn' },
            { code: 'marathi', name: 'मराठी (MARATHI)', apiCode: 'mr' },
            { code: 'english', name: 'ENGLISH', apiCode: 'en' }
        ];
        
        let content = '';
        
        // Fetch for each language
        for (const lang of languages) {
            try {
                if (lang.code === 'english') {
                    const englishDef = await this.fetchEnglishDefinition(word);
                    if (englishDef) {
                        content += this.formatEnglishSection(englishDef);
                    }
                } else {
                    const translation = await this.fetchTranslation(word, lang.apiCode);
                    if (translation) {
                        content += this.formatLanguageSection(lang.name, translation);
                    } else {
                        content += this.formatLanguageSection(lang.name, null);
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${lang.code}:`, error);
                content += this.formatLanguageSection(lang.name, null);
            }
        }
        
        if (!content.trim()) {
            content = `<div class="no-def">No definitions found for "${word}"</div>`;
        }
        
        document.getElementById('content-area').innerHTML = content;
    }

    async fetchEnglishDefinition(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (response.ok) {
                const data = await response.json();
                return data[0];
            }
        } catch (error) {
            console.error('English API error:', error);
        }
        return null;
    }

    async fetchTranslation(word, langCode) {
        try {
            // First get English definition
            const englishDef = await this.fetchEnglishDefinition(word);
            if (!englishDef?.meanings?.[0]?.definitions?.[0]) return null;
            
            const definition = englishDef.meanings[0].definitions[0].definition;
            
            // Translate to target language
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(definition)}&langpair=en|${langCode}`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.responseStatus === 200 && data.responseData?.translatedText) {
                    return data.responseData.translatedText;
                }
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
        return null;
    }

    formatLanguageSection(langName, definition) {
        return `<div class="section">
            <div class="lang-header">${langName}</div>
            <div class="definition">${definition || 'Definition not available'}</div>
        </div>`;
    }

    formatEnglishSection(data) {
        let html = `<div class="section">
            <div class="lang-header">ENGLISH</div>`;
        
        if (data.phonetic) {
            html += `<div class="phonetic">//${data.phonetic}//</div>`;
        }
        
        if (data.meanings?.[0]) {
            const meaning = data.meanings[0];
            html += `<div class="part-speech">${meaning.partOfSpeech}</div>`;
            
            if (meaning.definitions?.[0]) {
                html += `<div class="definition">${meaning.definitions[0].definition}</div>`;
                if (meaning.definitions[0].example) {
                    html += `<div class="example">"${meaning.definitions[0].example}"</div>`;
                }
            }
        }
        
        return html + '</div>';
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.currentTimer = 0;
        const timerCount = document.getElementById('timer-count');
        const timerText = document.getElementById('timer-text');
        const progressFill = document.getElementById('progress-fill');
        
        this.timerInterval = setInterval(() => {
            this.currentTimer++;
            const remaining = this.popupDuration - this.currentTimer;
            const progress = (this.currentTimer / this.popupDuration) * 100;
            
            if (timerCount) timerCount.textContent = this.currentTimer;
            if (timerText) timerText.textContent = `Auto-close in ${remaining}s`;
            if (progressFill) progressFill.style.width = `${100 - progress}%`;
            
            if (this.currentTimer >= this.popupDuration) {
                this.popup.style.display = 'none';
                clearInterval(this.timerInterval);
            }
        }, 1000);
    }
}

// Initialize immediately
new BhashaZapWorking();
console.log('BhashaZap: Working version loaded');