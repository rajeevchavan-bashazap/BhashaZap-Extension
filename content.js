// Enhanced Content Script for BhashaZap Extension - IMPROVED ERROR HANDLING
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
            "phone": "ಫೋನ್", "car": "ಕಾರ್", "school": "ಶಾಲೆ", "work": "ಕೆಲಸ",
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
            "phone": "ఫోన్", "car": "కార్", "school": "పాఠశాల", "work": "పని",
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
            "money": "பணம்", "friend": "நண்பர்"
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
            "money": "پیسے", "friend": "دوست"
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
        document.addEventListener('click', handle