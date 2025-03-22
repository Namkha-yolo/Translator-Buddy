// Translation service module for Voice Translation App

class TranslationService {
    constructor() {
        // Hardcoded API key - users won't need to enter it
        const hardcodedKey = "AIzaSyDrZcAkbvwUIbd7VtA7mk7sCVNTCVpGJpM";
        
        // Use hardcoded key or check localStorage as fallback
        this.apiKey = hardcodedKey || localStorage.getItem('googleApiKey');
        
        console.log("Translation service initialized. API key exists:", !!this.apiKey);
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
        if (!text) {
            console.error("No text provided for translation");
            return '';
        }
        
        console.log(`Starting translation request: ${text.substring(0, 30)}... from ${sourceLang} to ${targetLang}`);
        
        // API key is now hardcoded, so this check should always pass
        if (!this.hasApiKey()) {
            console.error("No API key available");
            throw new Error('API key configuration issue. Please contact the administrator.');
        }
        
        try {
            // Process language codes
            const sourceCode = sourceLang === 'auto' ? '' : sourceLang.split('-')[0];
            const targetCode = targetLang.split('-')[0];
            
            console.log(`Using language codes: source=${sourceCode || 'auto'}, target=${targetCode}`);
            
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
            
            const fullUrl = `${url}?${params}`;
            console.log(`Making API request to: ${url}`);
            
            // Make API request with CORS mode
            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'cors'
            });
            
            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error response: ${errorText}`);
                throw new Error(`API responded with status ${response.status}: ${errorText}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            
            // Check for API errors
            if (data.error) {
                console.error("API returned error:", data.error);
                throw new Error(data.error.message || 'Translation failed');
            }
            
            if (!data.data || !data.data.translations || !data.data.translations[0]) {
                console.error("Invalid API response structure:", data);
                throw new Error('Invalid translation response from API');
            }
            
            // Return translated text
            const result = data.data.translations[0].translatedText;
            console.log(`Translation successful: "${text.substring(0, 30)}..." -> "${result.substring(0, 30)}..."`);
            return result;
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }
    
    // Helper method for mock translation during development/testing
    mockTranslate(text, sourceLang, targetLang) {
        console.log("Using mock translation for:", text);
        return new Promise((resolve) => {
            setTimeout(() => {
                // Create a simple mock translation by reversing the text
                // and adding language codes
                const mockResult = `[${sourceLang} → ${targetLang}]: ${text}`;
                resolve(mockResult);
            }, 500);
        });
    }
}
