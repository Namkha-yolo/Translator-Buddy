// Translation service module for Voice Translation App

class TranslationService {
    constructor() {
        // Hardcoded API key - users won't need to enter it
        const hardcodedKey = "AIzaSyDrZcAkbvwUIbd7VtA7mk7sCVNTCVpGJpM";
        
        // Use hardcoded key or check localStorage as fallback
        this.apiKey = hardcodedKey || localStorage.getItem('googleApiKey');
    }
    
    // Set API key - keeping this method for potential future customization
    setApiKey(key) {
        if (key && key.trim() !== '') {
            this.apiKey = key.trim();
            localStorage.setItem('googleApiKey', this.apiKey);
            return true;
        }
        return false;
    }
    
    // Check if API key is set
    hasApiKey() {
        return this.apiKey && this.apiKey.trim() !== '';
    }
    
    // Translate text using Google Translate API
    async translate(text, sourceLang, targetLang) {
        if (!text) return '';
        
        // API key is now hardcoded, so this check should always pass
        if (!this.hasApiKey()) {
            throw new Error('API key configuration issue. Please contact the administrator.');
        }
        
        try {
            // Process language codes
            const sourceCode = sourceLang === 'auto' ? '' : sourceLang.split('-')[0];
            const targetCode = targetLang.split('-')[0];
            
            // Build request URL with parameters
            const url = 'https://translation.googleapis.com/language/translate/v2';
            const params = new URLSearchParams({
                q: text,
                target: targetCode,
                key: this.apiKey
            });
            
            // Add source language if specified
            if (sourceCode) {
                params.append('source', sourceCode);
            }
            
            // Make API request with CORS mode
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                mode: 'cors'
            });
            
            // Parse JSON response
            const data = await response.json();
            
            // Check for API errors
            if (data.error) {
                throw new Error(data.error.message || 'Translation failed');
            }
            
            // Return translated text
            return data.data.translations[0].translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }
    
    // Helper method for mock translation during development/testing
    mockTranslate(text, sourceLang, targetLang) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`[Translation of: "${text}" from ${sourceLang} to ${targetLang}]`);
            }, 1000);
        });
    }
}
