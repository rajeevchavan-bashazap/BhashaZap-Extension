// BhashaZap Simple Test Version
console.log('BhashaZap: Simple test version loading...');

// Simple popup creation and test
function createSimplePopup() {
    console.log('BhashaZap: Creating simple popup...');
    
    // Remove existing popup
    const existing = document.getElementById('bhashazap-test-popup');
    if (existing) {
        existing.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'bhashazap-test-popup';
    popup.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        min-width: 300px;
        text-align: center;
    `;
    
    popup.innerHTML = `
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
            BhashaZap Test
        </div>
        <div id="test-word" style="font-size: 16px; margin-bottom: 10px;">
            Word: <span style="color: #FFD700;">Loading...</span>
        </div>
        <div style="font-size: 12px; margin-bottom: 15px;">
            Double-click working! 🎉
        </div>
        <button onclick="document.getElementById('bhashazap-test-popup').style.display='none'" 
                style="background: white; color: #667eea; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
            Close
        </button>
    `;
    
    document.body.appendChild(popup);
    console.log('BhashaZap: Simple popup created and added to body');
    
    return popup;
}

// Simple double-click handler
function handleDoubleClick(event) {
    console.log('BhashaZap: Double-click detected!', event);
    
    const popup = document.getElementById('bhashazap-test-popup');
    if (!popup) {
        console.log('BhashaZap: Popup not found, creating...');
        createSimplePopup();
    }
    
    // Get selected text or word near click
    let word = window.getSelection().toString().trim();
    
    if (!word) {
        // Try to get word at cursor position
        const range = document.caretRangeFromPoint(event.clientX, event.clientY);
        if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
            const text = range.startContainer.textContent;
            const offset = range.startOffset;
            
            let start = offset;
            let end = offset;
            
            while (start > 0 && /\w/.test(text[start - 1])) start--;
            while (end < text.length && /\w/.test(text[end])) end++;
            
            word = text.substring(start, end).trim();
        }
    }
    
    if (!word) {
        word = 'test-word';
    }
    
    console.log('BhashaZap: Word to display:', word);
    
    // Update popup with word
    const wordElement = document.getElementById('test-word');
    if (wordElement) {
        wordElement.innerHTML = `Word: <span style="color: #FFD700;">${word}</span>`;
    }
    
    // Show popup
    const testPopup = document.getElementById('bhashazap-test-popup');
    if (testPopup) {
        testPopup.style.display = 'block';
        console.log('BhashaZap: Popup shown');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            testPopup.style.display = 'none';
            console.log('BhashaZap: Popup auto-hidden');
        }, 5000);
    } else {
        console.error('BhashaZap: Could not find test popup element');
    }
}

// Add double-click listener
document.addEventListener('dblclick', handleDoubleClick);
console.log('BhashaZap: Double-click listener added');

// Create popup immediately
createSimplePopup();

// Test popup after 2 seconds
setTimeout(() => {
    console.log('BhashaZap: Running automatic test...');
    const testPopup = document.getElementById('bhashazap-test-popup');
    if (testPopup) {
        const wordElement = document.getElementById('test-word');
        if (wordElement) {
            wordElement.innerHTML = `Word: <span style="color: #FFD700;">Auto-Test</span>`;
        }
        testPopup.style.display = 'block';
        console.log('BhashaZap: Auto-test popup shown');
        
        setTimeout(() => {
            testPopup.style.display = 'none';
            console.log('BhashaZap: Auto-test popup hidden');
        }, 3000);
    }
}, 2000);

console.log('BhashaZap: Simple test version loaded successfully');