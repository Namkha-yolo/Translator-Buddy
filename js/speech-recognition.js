// Speech recognition module for Voice Translation App

class SpeechRecognitionModule {
    constructor() {
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = this.SpeechRecognition ? new this.SpeechRecognition() : null;
        
        if (this.recognition) {
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            
            this.recognition.onresult = this.handleResult.bind(this);
            this.recognition.onerror = this.handleError.bind(this);
            this.recognition.onend = this.handleEnd.bind(this);
        }
        
        this.isRecording = false;
        
        // Callback placeholders
        this.onInterimResult = () => {};
        this.onFinalResult = () => {};
        this.onDetectedLanguage = () => {};
        this.onError = () => {};
    }
    
    isSupported() {
        return !!this.recognition;
    }
    
    start(language = 'auto') {
        if (!this.recognition) return;
        
        try {
            // Set language if specified
            if (language !== 'auto') {
                this.recognition.lang = language;
            }
            
            this.recognition.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Speech recognition start error:', error);
            this.onError(error.message);
        }
    }
    
    stop() {
        if (!this.recognition) return;
        
        try {
            this.recognition.stop();
            this.isRecording = false;
        } catch (error) {
            console.error('Speech recognition stop error:', error);
        }
    }
    
    handleResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Provide interim results for real-time feedback
        this.onInterimResult(interimTranscript);
        
        // Provide final results when available
        if (finalTranscript) {
            this.onFinalResult(finalTranscript);
        }
        
        // Check for detected language
        if (event.results[0] && event.results[0].isFinal) {
            try {
                const detectedLang = event.results[0][0].lang;
                if (detectedLang) {
                    this.onDetectedLanguage(detectedLang);
                }
            } catch (e) {
                // Some browsers might not support language detection
                console.log("Language detection not available");
            }
        }
    }
    
    handleError(event) {
        this.onError(event.error);
    }
    
    handleEnd() {
        // If we're still supposed to be recording, restart
        if (this.isRecording) {
            try {
                this.recognition.start();
            } catch (e) {
                // Ignore errors when trying to restart
                this.isRecording = false;
            }
        }
    }
}
