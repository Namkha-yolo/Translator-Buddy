const config = require('../config/config');

// Select translation service based on configuration
const translationService = config.translationService;

/**
 * Translate text using configured translation service
 */
exports.translateText = async (req, res) => {
    try {
        const { text, sourceLang, targetLang } = req.body;
        
        // Input validation
        if (!text) {
            return res.status(400).json({ 
                success: false, 
                message: 'Text is required' 
            });
        }
        
        if (!targetLang) {
            return res.status(400).json({ 
                success: false, 
                message: 'Target language is required' 
            });
        }
        
        // Process language codes
        const sourceCode = sourceLang === 'auto' ? null : sourceLang.split('-')[0];
        const targetCode = targetLang.split('-')[0];
        
        // Translate text using selected service
        let translatedText;
        
        switch (translationService) {
            case 'google':
                translatedText = await translateWithGoogle(text, sourceCode, targetCode);
                break;
            case 'azure':
                translatedText = await translateWithAzure(text, sourceCode, targetCode);
                break;
            case 'deepl':
                translatedText = await translateWithDeepL(text, sourceCode, targetCode);
                break;
            case 'libre':
                translatedText = await translateWithLibre(text, sourceCode, targetCode);
                break;
            default:
                throw new Error(`Unsupported translation service: ${translationService}`);
        }
        
        // Return successful response
        res.json({
            success: true,
            translation: translatedText,
            sourceLang: sourceCode || 'auto',
            targetLang: targetCode
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'An error occurred during translation' 
        });
    }
};

/**
 * Google Cloud Translation implementation
 */
async function translateWithGoogle(text, sourceCode, targetCode) {
    const apiKey = config.googleApiKey;
    
    const url = 'https://translation.googleapis.com/language/translate/v2';
    const params = new URLSearchParams({
        q: text,
        target: targetCode,
        format: 'text',
        key: apiKey
    });
    
    // Add source language if specified
    if (sourceCode) {
        params.append('source', sourceCode);
    }
    
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message || 'Google Translation API error');
    }
    
    return data.data.translations[0].translatedText;
}

/**
 * Microsoft Azure Translator implementation
 */
async function translateWithAzure(text, sourceCode, targetCode) {
    const subscriptionKey = config.azureApiKey;
    const endpoint = config.azureEndpoint;
    const location = config.azureRegion;
    
    const url = `${endpoint}/translate?api-version=3.0`;
    const params = new URLSearchParams({
        'to': targetCode
    });
    
    // Add source language if specified
    if (sourceCode) {
        params.append('from', sourceCode);
    }
    
    const response = await fetch(`${url}&${params}`, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Ocp-Apim-Subscription-Region': location,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ 'text': text }])
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error('Azure Translation API error');
    }
    
    return data[0].translations[0].text;
}

/**
 * DeepL API implementation
 */
async function translateWithDeepL(text, sourceCode, targetCode) {
    const authKey = config.deeplApiKey;
    const url = 'https://api-free.deepl.com/v2/translate';
    
    // Convert language codes to DeepL format
    const deepLTargetLang = targetCode.toUpperCase();
    const deepLSourceLang = sourceCode ? sourceCode.toUpperCase() : null;
    
    const formData = new FormData();
    formData.append('text', text);
    formData.append('target_lang', deepLTargetLang);
    
    // Add source language if specified
    if (deepLSourceLang) {
        formData.append('source_lang', deepLSourceLang);
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${authKey}`
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error('DeepL Translation API error');
    }
    
    return data.translations[0].text;
}

/**
 * LibreTranslate API implementation
 */
async function translateWithLibre(text, sourceCode, targetCode) {
    const apiKey = config.libreApiKey;
    const url = config.libreApiUrl || 'https://libretranslate.de/translate';
    
    const body = {
        q: text,
        target: targetCode,
        format: 'text'
    };
    
    // Add source language if specified
    if (sourceCode) {
        body.source = sourceCode;
    } else {
        body.source = 'auto';
    }
    
    // Add API key if provided
    if (apiKey) {
        body.api_key = apiKey;
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error('LibreTranslate API error');
    }
    
    return data.translatedText;
}
