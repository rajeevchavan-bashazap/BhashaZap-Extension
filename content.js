// Start countdown timer with circular display and progress bar
    function startCountdown(popup) {
        const progressBar = popup.querySelector('.bhashazap-countdown-progress');
        const circularTimer = popup.querySelector('.bhashazap-countdown-circle');
        if (!progressBar || !circularTimer) return;

        let timeLeft = popupDuration;
        const totalTime = popupDuration;
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Update initial display
        circularTimer.textContent = Math.ceil(timeLeft);
        
        countdownInterval = setInterval(() => {
            timeLeft -= 0.1;
            const percentage = (timeLeft / totalTime) * 100;
            
            if (percentage <= 0) {
                clearInterval(countdownInterval);
                if (currentPopup === popup) {
                    hidePopup();
                }
                return;
            }
            
            // Update progress bar
            progressBar.style.width = percentage + '%';
            
            // Update circular timer display
            const secondsLeft = Math.ceil(timeLeft);
            circularTimer.textContent = secondsLeft;
            
            // Change colors based on time remaining
            if (percentage <= 25) {
                progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
                circularTimer.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                circularTimer.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
            } else if (percentage <= 50) {
                progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
                circularTimer.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                circularTimer.style.boxShadow = '0 4px 12px rgba(245,// Enhanced Content Script for BhashaZap Extension - IMPROVED ERROR HANDLING
(function() {
    'use strict';

    // Check if Chrome extension APIs are available
    if (!chrome || !chrome.storage) {
        console.warn('BhashaZap: Chrome extension APIs not available');
        return;
    }

    // Extension state
    let isActive = true;
    let selectedLanguages = [];
    let popupDuration = 15;
    let currentPopup = null;
    let isInitialized = false;
    let countdownInterval = null;
    let apiCallCount = 0;
    const MAX_API_CALLS_PER_MINUTE = 10;

    // Language mapping
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

    // Enhanced offline dictionary with more words and better translations
    const offlineDictionary = {
        english: {
            "north": "the direction that is to your left when you are facing the rising sun",
            "south": "the direction that is to your right when you are facing the rising sun", 
            "east": "the direction toward the rising sun",
            "west": "the direction toward the setting sun",
            "water": "a clear liquid that has no color, taste, or smell",
            "fire": "the hot, glowing gas that you see when something burns",
            "earth": "the planet on which we live; soil or ground",
            "air": "the mixture of gases that surrounds the earth",
            "tree": "a large plant that has a wooden trunk and branches with leaves",
            "house": "a building where people live",
            "book": "a set of printed pages that are held together in a cover",
            "food": "things that people and animals eat",
            "love": "a strong feeling of caring about someone or something",
            "time": "the thing that is measured in minutes, hours, days, etc.",
            "light": "the brightness that comes from the sun, fire, etc.",
            "dark": "having little or no light",
            "good": "of high quality; better than average",
            "bad": "of poor quality; worse than average",
            "big": "large in size, amount, or degree",
            "small": "little in size, amount, or degree",
            "hello": "a greeting used when meeting someone",
            "world": "the earth and all the people and things on it",
            "computer": "an electronic machine that can store and process information",
            "internet": "a global network of connected computers",
            "phone": "a device used for talking to people at a distance",
            "car": "a vehicle with four wheels that is powered by an engine",
            "school": "a place where children go to learn",
            "work": "activity involving mental or physical effort",
            "money": "coins and bills used to buy things",
            "friend": "a person you know well and like"
        },
        
        // Enhanced translations with corrections
        hi: {
            "north": "उत्तर", "south": "दक्षिण", "east": "पूर्व", "west": "पश्चिम",
            "water": "पानी", "fire": "आग", "earth": "पृथ्वी", "air": "हवा",
            "tree": "पेड़", "house": "घर", "book": "किताब", "food": "खाना",
            "love": "प्रेम", "time": "समय", "light": "प्रकाश", "dark": "अंधेरा",
            "good": "अच्छा", "bad": "बुरा", "big": "बड़ा", "small": "छोटा",
            "hello": "नमस्ते", "world": "दुनिया", "computer": "कंप्यूटर", "internet": "इंटरनेट",
            "phone": "फोन", "car": "कार", "school": "स्कूल", "work": "काम",
            "money": "पैसा", "friend": "दोस्त"
        },
        
        kn: {
            "north": "ಉತ್ತರ", "south": "ದಕ್ಷಿಣ", "east": "ಪೂರ್ವ", "west": "ಪಶ್ಚಿಮ",
            "water": "ನೀರು", "fire": "ಬೆಂಕಿ", "earth": "ಭೂಮಿ", "air": "ಗಾಳಿ",
            "tree": "ಮರ", "house": "ಮನೆ", "book": "ಪುಸ್ತಕ", "food": "ಆಹಾರ",
            "love": "ಪ್ರೀತಿ", "time": "ಸಮಯ", "light": "ಬೆಳಕು", "dark": "ಕತ್ತಲೆ",
            "good": "ಒಳ್ಳೆಯದು", "bad": "ಕೆಟ್ಟದು", "big": "ದೊಡ್ಡದು", "small": "ಚಿಕ್ಕದು",
            "hello": "ನಮಸ್ಕಾರ", "world": "ಪ್ರಪಂಚ", "computer": "ಕಂಪ್ಯೂಟರ್", "internet": "ಇಂಟರ್ನೆಟ್",
            "phone": "ಫೋನ್", "car": "ಕಾರು", "school": "ಶಾಲೆ", "work": "ಕೆಲಸ",
            "money": "ಹಣ", "friend": "ಸ್ನೇಹಿತ"
        },
        
        mr: {
            "north": "उत्तर", "south": "दक्षिण", "east": "पूर्व", "west": "पश्चिम",
            "water": "पाणी", "fire": "आग", "earth": "पृथ्वी", "air": "हवा",
            "tree": "झाड", "house": "घर", "book": "पुस्तक", "food": "अन्न",
            "love": "प्रेम", "time": "वेळ", "light": "प्रकाश", "dark": "अंधार",
            "good": "चांगले", "bad": "वाईट", "big": "मोठे", "small": "लहान",
            "hello": "नमस्कार", "world": "जग", "computer": "संगणक", "internet": "इंटरनेट",
            "phone": "फोन", "car": "कार", "school": "शाळा", "work": "काम",
            "money": "पैसे", "friend": "मित्र"
        },
        
        te: {
            "north": "ఉత్తరం", "south": "దక్షిణం", "east": "తూర్పు", "west": "పశ్చిమం",
            "water": "నీరు", "fire": "అగ్ని", "earth": "భూమి", "air": "గాలి",
            "tree": "చెట్టు", "house": "ఇల్లు", "book": "పుస్తకం", "food": "ఆహారం",
            "love": "ప్రేమ", "time": "సమయం", "light": "వెలుగు", "dark": "చీకటి",
            "good": "మంచిది", "bad": "చెడ్డది", "big": "పెద్దది", "small": "చిన్నది",
            "hello": "నమస్కారం", "world": "ప్రపంచం", "computer": "కంప్యూటర్", "internet": "ఇంటర్నెట్",
            "phone": "ఫోన్", "car": "కారు", "school": "పాఠశాల", "work": "పని",
            "money": "డబ్బు", "friend": "స్నేహితుడు"
        },
        
        ta: {
            "north": "வடக்கு", "south": "தெற்கு", "east": "கிழக்கு", "west": "மேற்கு",
            "water": "நீர்", "fire": "நெருப்பு", "earth": "பூமி", "air": "காற்று",
            "tree": "மரம்", "house": "வீடு", "book": "புத்தகம்", "food": "உணவு",
            "love": "காதல்", "time": "நேரம்", "light": "ஒளி", "dark": "இருட்டு",
            "good": "நல்லது", "bad": "கெட்டது", "big": "பெரிய", "small": "சிறிய",
            "hello": "வணக்கம்", "world": "உலகம்", "computer": "கணினி", "internet": "இணையம்",
            "phone": "தொலைபேசி", "car": "கார்", "school": "பள்ளி", "work": "வேலை",
            "money": "பணம்", "friend": "நண்பன்"
        },
        
        gu: {
            "north": "ઉત્તર", "south": "દક્ષિણ", "east": "પૂર્વ", "west": "પશ્ચિમ",
            "water": "પાણી", "fire": "આગ", "earth": "પૃથ્વી", "air": "હવા",
            "tree": "વૃક્ષ", "house": "ઘર", "book": "પુસ્તક", "food": "ખોરાક",
            "love": "પ્રેમ", "time": "સમય", "light": "પ્રકાશ", "dark": "અંધકાર",
            "good": "સારું", "bad": "ખરાબ", "big": "મોટું", "small": "નાનું",
            "hello": "નમસ્તે", "world": "દુનિયા", "computer": "કમ્પ્યુટર", "internet": "ઇન્ટરનેટ",
            "phone": "ફોન", "car": "કાર", "school": "શાળા", "work": "કામ",
            "money": "પૈસા", "friend": "મિત્ર"
        },
        
        bn: {
            "north": "উত্তর", "south": "দক্ষিণ", "east": "পূর্ব", "west": "পশ্চিম",
            "water": "জল", "fire": "আগুন", "earth": "পৃথিবী", "air": "বাতাস",
            "tree": "গাছ", "house": "ঘর", "book": "বই", "food": "খাবার",
            "love": "ভালোবাসা", "time": "সময়", "light": "আলো", "dark": "অন্ধকার",
            "good": "ভাল", "bad": "খারাপ", "big": "বড়", "small": "ছোট",
            "hello": "নমস্কার", "world": "বিশ্ব", "computer": "কম্পিউটার", "internet": "ইন্টারনেট",
            "phone": "ফোন", "car": "গাড়ি", "school": "স্কুল", "work": "কাজ",
            "money": "টাকা", "friend": "বন্ধু"
        },
        
        pa: {
            "north": "ਉੱਤਰ", "south": "ਦੱਖਣ", "east": "ਪੂਰਬ", "west": "ਪੱਛਮ",
            "water": "ਪਾਣੀ", "fire": "ਅੱਗ", "earth": "ਧਰਤੀ", "air": "ਹਵਾ",
            "tree": "ਰੁੱਖ", "house": "ਘਰ", "book": "ਕਿਤਾਬ", "food": "ਭੋਜਨ",
            "love": "ਪਿਆਰ", "time": "ਸਮਾਂ", "light": "ਰੋਸ਼ਨੀ", "dark": "ਹਨੇਰਾ",
            "good": "ਚੰਗਾ", "bad": "ਮਾੜਾ", "big": "ਵੱਡਾ", "small": "ਛੋਟਾ",
            "hello": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "world": "ਸੰਸਾਰ", "computer": "ਕੰਪਿਊਟਰ", "internet": "ਇੰਟਰਨੈੱਟ",
            "phone": "ਫ਼ੋਨ", "car": "ਕਾਰ", "school": "ਸਕੂਲ", "work": "ਕੰਮ",
            "money": "ਪੈਸਾ", "friend": "ਦੋਸਤ"
        },
        
        ml: {
            "north": "വടക്ക്", "south": "തെക്ക്", "east": "കിഴക്ക്", "west": "പടിഞ്ഞാറ്",
            "water": "വെള്ളം", "fire": "തീ", "earth": "ഭൂമി", "air": "വായു",
            "tree": "മരം", "house": "വീട്", "book": "പുസ്തകം", "food": "ഭക്ഷണം",
            "love": "സ്നേഹം", "time": "സമയം", "light": "വെളിച്ചം", "dark": "ഇരുട്ട്",
            "good": "നല്ലത്", "bad": "മോശം", "big": "വലിയ", "small": "ചെറിയ",
            "hello": "നമസ്കാരം", "world": "ലോകം", "computer": "കമ്പ്യൂട്ടർ", "internet": "ഇന്റർനെറ്റ്",
            "phone": "ഫോൺ", "car": "കാർ", "school": "സ്കൂൾ", "work": "ജോലി",
            "money": "പണം", "friend": "സുഹൃത്ത്"
        },
        
        ur: {
            "north": "شمال", "south": "جنوب", "east": "مشرق", "west": "مغرب",
            "water": "پانی", "fire": "آگ", "earth": "زمین", "air": "ہوا",
            "tree": "درخت", "house": "گھر", "book": "کتاب", "food": "کھانا",
            "love": "محبت", "time": "وقت", "light": "روشنی", "dark": "اندھیرا",
            "good": "اچھا", "bad": "برا", "big": "بڑا", "small": "چھوٹا",
            "hello": "السلام علیکم", "world": "دنیا", "computer": "کمپیوٹر", "internet": "انٹرنیٹ",
            "phone": "فون", "car": "کار", "school": "سکول", "work": "کام",
            "money": "پیسہ", "friend": "دوست"
        }
    };

    // Initialize with retry mechanism
    function init() {
        if (isInitialized) return;
        
        try {
            loadSettings();
            setupEventListeners();
            isInitialized = true;
            console.log('BhashaZap: Extension initialized successfully');
        } catch (error) {
            console.error('BhashaZap: Initialization error:', error);
            setTimeout(init, 1000);
        }
    }

    // Load settings with error handling
    function loadSettings() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('BhashaZap: Storage API not available');
                return;
            }

            chrome.storage.sync.get({
                selectedLanguages: [],
                isExtensionActive: true,
                popupDuration: 15
            }, function(result) {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.error('BhashaZap: Storage error:', chrome.runtime.lastError);
                    return;
                }
                
                selectedLanguages = result.selectedLanguages || [];
                isActive = result.isExtensionActive !== false;
                popupDuration = result.popupDuration || 15;
                
                console.log('BhashaZap: Settings loaded:', { 
                    selectedLanguages, 
                    isActive, 
                    popupDuration 
                });
            });
        } catch (error) {
            console.error('BhashaZap: Error loading settings:', error);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        document.removeEventListener('dblclick', handleDoubleClick, true);
        document.removeEventListener('click', handleClick, true);
        
        document.addEventListener('dblclick', handleDoubleClick, true);
        document.addEventListener('click', handleClick, true);

        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                try {
                    if (message.action === 'toggleExtension') {
                        isActive = message.isActive;
                        console.log('BhashaZap: Extension toggled:', isActive);
                        if (!isActive && currentPopup) {
                            hidePopup();
                        }
                        sendResponse({ success: true });
                    } else if (message.action === 'settingsChanged') {
                        loadSettings();
                        sendResponse({ success: true });
                    }
                } catch (error) {
                    console.error('BhashaZap: Error handling message:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            });
        }
    }

    // Handle double click
    function handleDoubleClick(e) {
        try {
            if (!isActive) {
                console.log('BhashaZap: Extension is inactive');
                return;
            }

            const target = e.target;
            const excludedTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
            const excludedClasses = ['bhashazap-popup'];
            
            if (excludedTags.includes(target.tagName) || 
                excludedClasses.some(cls => target.classList.contains(cls))) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            
            const word = getWordAtPosition(e.clientX, e.clientY);
            if (word && word.trim().length > 0 && /^[a-zA-Z]+$/.test(word.trim())) {
                console.log('BhashaZap: Translating word:', word.trim());
                showTranslation(word.trim().toLowerCase(), e.clientX, e.clientY);
            } else if (word) {
                console.log('BhashaZap: Invalid word selected:', word);
                showErrorPopup('Please select a valid English word.', e.clientX, e.clientY);
            }
        } catch (error) {
            console.error('BhashaZap: Error in handleDoubleClick:', error);
        }
    }

    // Handle click to hide popup
    function handleClick(e) {
        try {
            if (currentPopup && !currentPopup.contains(e.target)) {
                hidePopup();
            }
        } catch (error) {
            console.error('BhashaZap: Error in handleClick:', error);
        }
    }

    // Get word at position
    function getWordAtPosition(x, y) {
        try {
            const element = document.elementFromPoint(x, y);
            if (!element) return '';

            if (!element.textContent && !element.innerText) return '';

            let range = null;
            let textNode = null;
            let offset = 0;

            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(x, y);
                if (range) {
                    textNode = range.startContainer;
                    offset = range.startOffset;
                }
            }
            else if (document.caretPositionFromPoint) {
                const position = document.caretPositionFromPoint(x, y);
                if (position) {
                    textNode = position.offsetNode;
                    offset = position.offset;
                }
            }

            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                const text = element.textContent || element.innerText || '';
                const words = text.trim().split(/\s+/);
                return words.length > 0 ? words[0] : '';
            }

            const text = textNode.textContent || '';
            let start = offset;
            let end = offset;
            
            const wordRegex = /[a-zA-Z]/;
            
            while (start > 0 && wordRegex.test(text[start - 1])) {
                start--;
            }
            
            while (end < text.length && wordRegex.test(text[end])) {
                end++;
            }
            
            return text.substring(start, end);
        } catch (error) {
            console.error('BhashaZap: Error getting word at position:', error);
            return '';
        }
    }

    // Show error popup
    function showErrorPopup(message, x, y) {
        try {
            hidePopup();

            const popup = document.createElement('div');
            popup.className = 'bhashazap-popup bhashazap-error';
            
            popup.innerHTML = `
                <div class="bhashazap-header bhashazap-drag-handle">
                    <div class="bhashazap-word">BhashaZap</div>
                    <button class="bhashazap-close">×</button>
                </div>
                <div class="bhashazap-error-message">${message}</div>
                <div class="bhashazap-footer">
                    <div class="bhashazap-brand">BhashaZap 2.0.0</div>
                </div>
            `;

            positionAndShowPopup(popup, x, y);
            makeDraggable(popup);
            
            setTimeout(function() {
                if (currentPopup === popup) {
                    hidePopup();
                }
            }, 5000);
        } catch (error) {
            console.error('BhashaZap: Error showing error popup:', error);
        }
    }

    // ENHANCED: Check if we have offline translation first
    function getOfflineTranslation(word, langCode) {
        const lowerWord = word.toLowerCase();
        return offlineDictionary[langCode] && offlineDictionary[langCode][lowerWord] 
            ? offlineDictionary[langCode][lowerWord] 
            : null;
    }

    // ENHANCED: Show translation with offline fallback and better error handling
    async function showTranslation(word, x, y) {
        try {
            hidePopup();

            // Properly capitalize the word for display
            const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

            // Get offline translations first
            const translations = {};
            let hasOfflineTranslations = false;

            // Get English definition from offline dictionary
            if (offlineDictionary.english[word]) {
                translations['en'] = offlineDictionary.english[word];
                hasOfflineTranslations = true;
            }

            // Get offline translations for selected languages
            if (selectedLanguages && selectedLanguages.length > 0) {
                selectedLanguages.forEach(langCode => {
                    const offlineTranslation = getOfflineTranslation(word, langCode);
                    if (offlineTranslation) {
                        translations[langCode] = offlineTranslation;
                        hasOfflineTranslations = true;
                    }
                });
            }

            // If we have offline translations, show them immediately
            if (hasOfflineTranslations) {
                console.log('BhashaZap: Using offline translations for:', word);
                
                // Fill missing translations with API calls if needed
                const missingTranslations = [];
                if (!translations['en']) {
                    missingTranslations.push('en');
                }
                selectedLanguages.forEach(langCode => {
                    if (!translations[langCode]) {
                        missingTranslations.push(langCode);
                    }
                });

                // Show popup with available translations
                createTranslationPopup(capitalizedWord, translations, x, y);

                // Try to get missing translations in background (non-blocking)
                if (missingTranslations.length > 0 && apiCallCount < MAX_API_CALLS_PER_MINUTE) {
                    fetchMissingTranslations(word, missingTranslations, capitalizedWord, x, y);
                }
            } else {
                // No offline translations available, show loading and fetch from API
                const loadingPopup = document.createElement('div');
                loadingPopup.className = 'bhashazap-popup bhashazap-draggable';
                loadingPopup.innerHTML = `
                    <div class="bhashazap-header bhashazap-drag-handle">
                        <div class="bhashazap-word">${capitalizedWord}</div>
                        <button class="bhashazap-close">×</button>
                    </div>
                    <div class="bhashazap-loading">Translating...</div>
                    <div class="bhashazap-footer">
                        <div class="bhashazap-brand">BhashaZap 2.0.0</div>
                    </div>
                `;

                positionAndShowPopup(loadingPopup, x, y);
                makeDraggable(loadingPopup);

                // Fetch all translations
                await fetchAllTranslations(word, capitalizedWord, x, y);
            }

        } catch (error) {
            console.error('BhashaZap: Translation process error:', error);
            if (currentPopup) {
                hidePopup();
                showErrorPopup('Translation service temporarily unavailable.', x, y);
            }
        }
    }

    // ENHANCED: Fetch missing translations without blocking UI
    async function fetchMissingTranslations(word, missingLangs, capitalizedWord, x, y) {
        try {
            if (apiCallCount >= MAX_API_CALLS_PER_MINUTE) return;

            const newTranslations = {};
            
            for (const lang of missingLangs) {
                if (apiCallCount >= MAX_API_CALLS_PER_MINUTE) break;
                
                try {
                    if (lang === 'en') {
                        newTranslations[lang] = await getEnglishDefinition(word);
                    } else {
                        newTranslations[lang] = await translateWordAPI(word, lang);
                    }
                    apiCallCount++;
                } catch (error) {
                    console.log(`BhashaZap: Could not fetch ${lang} translation:`, error.message);
                    // Use fallback
                    newTranslations[lang] = lang === 'en' 
                        ? `${word} (English meaning)`
                        : `${word} (${languageNames[lang] || lang})`;
                }
            }

            // Update the current popup if it's still showing the same word
            if (currentPopup && currentPopup.querySelector('.bhashazap-word')?.textContent === capitalizedWord) {
                updatePopupTranslations(newTranslations);
            }

        } catch (error) {
            console.error('BhashaZap: Error fetching missing translations:', error);
        }
    }

    // ENHANCED: Fetch all translations with better error handling
    async function fetchAllTranslations(word, capitalizedWord, x, y) {
        try {
            const translations = {};
            const translationPromises = [];

            // Always get English definition first
            translationPromises.push(
                getEnglishDefinition(word)
                    .then(definition => {
                        translations['en'] = definition;
                        apiCallCount++;
                    })
                    .catch(error => {
                        console.log('BhashaZap: English definition error:', error.message);
                        translations['en'] = `${word} (English meaning)`;
                    })
            );

            // Only get translations for user-selected languages
            if (selectedLanguages && selectedLanguages.length > 0) {
                selectedLanguages.forEach(langCode => {
                    if (apiCallCount < MAX_API_CALLS_PER_MINUTE) {
                        translationPromises.push(
                            translateWordAPI(word, langCode)
                                .then(translation => {
                                    translations[langCode] = translation;
                                    apiCallCount++;
                                })
                                .catch(error => {
                                    console.log(`BhashaZap: Translation error for ${langCode}:`, error.message);
                                    translations[langCode] = `${word} (${languageNames[langCode] || langCode})`;
                                })
                        );
                    } else {
                        translations[langCode] = `${word} (${languageNames[langCode] || langCode})`;
                    }
                });
            }

            // Wait for API calls with timeout
            await Promise.race([
                Promise.allSettled(translationPromises),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Translation timeout')), 10000)
                )
            ]);

            if (currentPopup) {
                hidePopup();
                createTranslationPopup(capitalizedWord, translations, x, y);
            }

        } catch (error) {
            console.error('BhashaZap: Translation process error:', error);
            if (currentPopup) {
                hidePopup();
                showErrorPopup('Using offline translations only.', x, y);
            }
        }
    }

    // Update existing popup with new translations
    function updatePopupTranslations(newTranslations) {
        if (!currentPopup) return;

        const translationsContainer = currentPopup.querySelector('.bhashazap-translations');
        if (!translationsContainer) return;

        Object.keys(newTranslations).forEach(langCode => {
            // Find existing translation element or create new one
            let existingElement = translationsContainer.querySelector(`[data-lang="${langCode}"]`);
            
            if (!existingElement) {
                existingElement = document.createElement('div');
                existingElement.className = 'bhashazap-translation';
                existingElement.setAttribute('data-lang', langCode);
                
                const langName = langCode === 'en' ? 'English' : (languageNames[langCode] || langCode.toUpperCase());
                existingElement.innerHTML = `
                    <div class="bhashazap-lang-name">${langName}</div>
                    <div class="bhashazap-translation-text">${newTranslations[langCode]}</div>
                `;
                
                if (langCode === 'en') {
                    translationsContainer.insertBefore(existingElement, translationsContainer.firstChild);
                } else {
                    translationsContainer.appendChild(existingElement);
                }
            } else {
                // Update existing translation
                const textElement = existingElement.querySelector('.bhashazap-translation-text');
                if (textElement) {
                    textElement.textContent = newTranslations[langCode];
                }
            }
        });
    }

    // ENHANCED: Get English definition with multiple fallbacks
    async function getEnglishDefinition(word) {
        // Try offline first
        if (offlineDictionary.english[word]) {
            return offlineDictionary.english[word];
        }

        // Try API with better error handling
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
                    const firstMeaning = data[0].meanings[0];
                    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                        return firstMeaning.definitions[0].definition;
                    }
                }
            }
            
            throw new Error('No definition found');
        } catch (error) {
            console.log('BhashaZap: Dictionary API failed:', error.message);
            return `${word} (English meaning)`;
        }
    }

    // ENHANCED: Translate word with better rate limiting and fallbacks
    async function translateWordAPI(word, toLang) {
        // Try offline first
        const offlineTranslation = getOfflineTranslation(word, toLang);
        if (offlineTranslation) {
            return offlineTranslation;
        }

        // Check rate limit
        if (apiCallCount >= MAX_API_CALLS_PER_MINUTE) {
            throw new Error('Rate limit exceeded');
        }

        const maxRetries = 2;
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000); // Reduced timeout

                const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${toLang}&de=your-email@domain.com`;
                
                const response = await fetch(apiUrl, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'BhashaZap Extension 2.0'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (data.responseStatus === 200 && 
                    data.responseData && 
                    data.responseData.translatedText &&
                    data.responseData.translatedText.toLowerCase() !== word.toLowerCase() &&
                    !data.responseData.translatedText.includes('NO QUERY SPECIFIED')) {
                    return data.responseData.translatedText;
                }

                throw new Error('Invalid API response');

            } catch (error) {
                lastError = error;
                console.log(`BhashaZap: Translation attempt ${attempt + 1} failed:`, error.message);
                
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }

        // Final fallback
        throw new Error(`Translation failed: ${lastError.message}`);
    }

    // Create translation popup with proper structure and countdown
    function createTranslationPopup(word, translations, x, y) {
        try {
            const popup = document.createElement('div');
            popup.className = 'bhashazap-popup bhashazap-draggable';
            
            let translationsHTML = '';

            // Always show English definition first
            if (translations['en']) {
                translationsHTML += `
                    <div class="bhashazap-translation" data-lang="en">
                        <div class="bhashazap-lang-name">English</div>
                        <div class="bhashazap-translation-text">${translations['en']}</div>
                    </div>
                `;
            }

            // Show translations for selected languages
            if (selectedLanguages && selectedLanguages.length > 0) {
                selectedLanguages.forEach(langCode => {
                    if (translations[langCode]) {
                        const languageName = languageNames[langCode] || langCode.toUpperCase();
                        translationsHTML += `
                            <div class="bhashazap-translation" data-lang="${langCode}">
                                <div class="bhashazap-lang-name">${languageName}</div>
                                <div class="bhashazap-translation-text">${translations[langCode]}</div>
                            </div>
                        `;
                    }
                });
            } else {
                // Show message when no languages selected
                translationsHTML += `
                    <div class="bhashazap-translation">
                        <div class="bhashazap-error-message">Select Indian languages from the extension popup to see translations.</div>
                    </div>
                `;
            }

            popup.innerHTML = `
                <div class="bhashazap-header bhashazap-drag-handle">
                    <div class="bhashazap-word">${word}</div>
                    <button class="bhashazap-close">×</button>
                </div>
                <div class="bhashazap-countdown-container">
                    <div class="bhashazap-countdown-circle">${popupDuration}</div>
                    <div class="bhashazap-countdown-bar">
                        <div class="bhashazap-countdown-progress" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="bhashazap-translations">
                    ${translationsHTML}
                </div>
                <div class="bhashazap-footer">
                    <div class="bhashazap-brand">BhashaZap 2.0.0</div>
                </div>
            `;

            positionAndShowPopup(popup, x, y);
            makeDraggable(popup);
            startCountdown(popup);

        } catch (error) {
            console.error('BhashaZap: Error creating translation popup:', error);
        }
    }

    // Start countdown timer with proper animation and time display
    function startCountdown(popup) {
        const progressBar = popup.querySelector('.bhashazap-countdown-progress');
        const timeDisplay = popup.querySelector('.bhashazap-countdown-time');
        if (!progressBar || !timeDisplay) return;

        let timeLeft = popupDuration;
        const totalTime = popupDuration;
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Update initial display
        timeDisplay.textContent = Math.ceil(timeLeft) + 's';
        
        countdownInterval = setInterval(() => {
            timeLeft -= 0.1;
            const percentage = (timeLeft / totalTime) * 100;
            
            if (percentage <= 0) {
                clearInterval(countdownInterval);
                if (currentPopup === popup) {
                    hidePopup();
                }
                return;
            }
            
            // Update progress bar
            progressBar.style.width = percentage + '%';
            
            // Update time display (show seconds remaining)
            timeDisplay.textContent = Math.ceil(timeLeft) + 's';
            
            // Change color based on time remaining
            if (percentage <= 25) {
                progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
                timeDisplay.style.color = '#ef4444';
            } else if (percentage <= 50) {
                progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
                timeDisplay.style.color = '#f59e0b';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
                timeDisplay.style.color = '#6b7280';
            }
        }, 100);
    }

    // Make popup properly draggable
    function makeDraggable(popup) {
        const dragHandle = popup.querySelector('.bhashazap-drag-handle');
        if (!dragHandle) return;

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        function dragStart(e) {
            if (e.target.classList.contains('bhashazap-close')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                isDragging = true;
                dragHandle.style.cursor = 'grabbing';
                popup.style.userSelect = 'none';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                popup.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            dragHandle.style.cursor = 'grab';
            popup.style.userSelect = '';
        }

        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Set initial cursor
        dragHandle.style.cursor = 'grab';
    }

    // Position and show popup with proper event handlers
    function positionAndShowPopup(popup, x, y) {
        try {
            document.body.appendChild(popup);
            currentPopup = popup;

            const popupRect = popup.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = x - popupRect.width / 2;
            let top = y - popupRect.height - 10;

            if (left < 10) {
                left = 10;
            } else if (left + popupRect.width > viewportWidth - 10) {
                left = viewportWidth - popupRect.width - 10;
            }

            if (top < 10) {
                top = y + 10;
            }

            if (top + popupRect.height > viewportHeight - 10) {
                top = viewportHeight - popupRect.height - 10;
            }

            popup.style.left = left + 'px';
            popup.style.top = top + 'px';

            // Set up close button
            const closeBtn = popup.querySelector('.bhashazap-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    hidePopup();
                });
            }

            console.log('BhashaZap: Popup shown at position:', { left, top });

        } catch (error) {
            console.error('BhashaZap: Error positioning popup:', error);
        }
    }

    // Hide current popup with proper cleanup
    function hidePopup() {
        try {
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            if (currentPopup && currentPopup.parentNode) {
                currentPopup.parentNode.removeChild(currentPopup);
                console.log('BhashaZap: Popup hidden');
            }
            currentPopup = null;
        } catch (error) {
            console.error('BhashaZap: Error hiding popup:', error);
        }
    }

    // Reset API call counter every minute
    setInterval(() => {
        apiCallCount = 0;
        console.log('BhashaZap: API call counter reset');
    }, 60000);

    // Listen for storage changes
    if (chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
            if (areaName === 'sync') {
                console.log('BhashaZap: Settings changed, reloading...');
                loadSettings();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('BhashaZap: Enhanced content script loaded - IMPROVED ERROR HANDLING');

})();