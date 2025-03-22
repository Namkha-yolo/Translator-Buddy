class TranslationService {
    constructor() {
        // Base URL for API calls - can be configured for different environments
        this.apiBaseUrl = '/api';
    }
    
    async translate(text, sourceLang, targetLang) {
        if (!text) return '';
        
        try {
            // Call the backend API endpoint
            const response = await fetch(`${this.apiBaseUrl}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    sourceLang,
                    targetLang
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Translation request failed');
            }
            
            const data = await response.json();
            return data.translation;
        } catch (error) {
            console.error('Translation service error:', error);
            throw error;
        }
    }
}

// =======================================
// File: frontend/js/speech-synthesis.js
// =======================================
// Speech synthesis module

class SpeechSynthesisModule {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        
        // Load available voices
        if (this.synth) {
            this.loadVoices();
            
            // Chrome requires this event
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = this.loadVoices.bind(this);
            }
        }
    }
    
    loadVoices() {
        this.voices = this.synth ? this.synth.getVoices() : [];
    }
    
    getVoicesForLanguage(languageCode) {
        if (!this.synth || !languageCode) return [];
        
        // Extract the main language code (e.g., 'en-US' -> 'en')
        const mainCode = languageCode.split('-')[0];
        
        return this.voices.filter(voice => 
            voice.lang.startsWith(mainCode) || 
            voice.lang.startsWith(languageCode)
        );
    }
    
    speak(text, languageCode, options = {}) {
        if (!this.synth || !text) return;
        
        // Cancel any current speech
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language
        utterance.lang = languageCode;
        
        // Set voice if available for this language
        const voices = this.getVoicesForLanguage(languageCode);
        if (voices.length > 0) {
            utterance.voice = voices[0]; // Use first available voice
        }
        
        // Set other options
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        // Add event handlers
        utterance.onstart = options.onStart || null;
        utterance.onend = options.onEnd || null;
        utterance.onerror = options.onError || null;
        
        // Speak
        this.synth.speak(utterance);
    }
    
    cancel() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}