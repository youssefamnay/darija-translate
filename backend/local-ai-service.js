const translate = async (text) => {
    // Dictionary-based translation (Mock AI)
    const dictionary = {
        'hello': 'salam',
        'hi': 'salam',
        'good morning': 'sbah lkhir',
        'good night': 'layla saeida',
        'how are you': 'ki dayr',
        'thank you': 'shokran',
        'goodbye': 'bslama',
        'yes': 'ah',
        'no': 'la',
        'please': 'afak',
        'i love you': 'kanbghik',
        'friend': 'sahbi',
        'money': 'flous',
        'food': 'makla'
    };

    const lowercaseText = text.toLowerCase().trim();
    if (dictionary[lowercaseText]) {
        return dictionary[lowercaseText];
    }

    // Simulate AI processing delay
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`[AI Translation] ${text} (Darija)`);
        }, 500);
    });
};

module.exports = { translate };
