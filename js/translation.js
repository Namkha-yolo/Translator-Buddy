// Translation service module - GitHub Pages version
// This version makes direct API calls to Google Translate

class TranslationService {
    constructor() {
        // Try to get API key from local storage
        this.apiKey = localStorage.getItem('googleApiKey') || '';
    }
    
    // Set API key
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
        
        // Check for API key
        if (!this.hasApiKey()) {
            throw new Error('Google Translate API key is required. Please enter your API key.');
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