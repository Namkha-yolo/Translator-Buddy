// Speech synthesis module for Voice Translation App

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
