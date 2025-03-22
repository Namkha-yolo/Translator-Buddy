// Main application logic for GitHub Pages version

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const recordButton = document.getElementById('recordButton');
    const originalTextElement = document.getElementById('originalText');
    const translationTextElement = document.getElementById('translationText');
    const statusElement = document.getElementById('status');
    const errorMessageElement = document.getElementById('errorMessage');
    const detectedLanguageElement = document.getElementById('detectedLanguage');
    const sourceLanguageSelect = document.getElementById('sourceLanguage');
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const swapLanguagesButton = document.getElementById('swapLanguages');
    const speakOriginalButton = document.getElementById('speakOriginal');
    const speakTranslationButton = document.getElementById('speakTranslation');
    const copyOriginalButton = document.getElementById('copyOriginal');
    const copyTranslationButton = document.getElementById('copyTranslation');
    const audioVisualizer = document.getElementById('audioVisualizer');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    
    // Initialize modules
    const speechRecognition = new SpeechRecognitionModule();
    const speechSynthesis = new SpeechSynthesisModule();
    const translationService = new TranslationService();
    
    // Create audio visualization elements
    for (let i = 0; i < 20; i++) {
        const audioBar = document.createElement('div');
        audioBar.className = 'audio-bar';
        audioVisualizer.appendChild(audioBar);
    }
    const audioBars = Array.from(audioVisualizer.children);
    
    // Variables
    let isRecording = false;
    let recognizedText = '';
    let translatedText = '';
    
    // Check for speech recognition support
    if (!speechRecognition.isSupported()) {
        errorMessageElement.textContent = 'Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.';
        recordButton.disabled = true;
        return;
    }
    
    // Initialize API key from storage
    if (translationService.hasApiKey()) {
        apiKeyInput.value = '************'; // Don't show actual key
        apiKeyStatus.textContent = 'API key saved';
        apiKeyStatus.style.color = 'green';
    }
    
    // Event Listeners
    recordButton.addEventListener('click', toggleRecording);
    swapLanguagesButton.addEventListener('click', swapLanguages);
    speakOriginalButton.addEventListener('click', () => speechSynthesis.speak(recognizedText, sourceLanguageSelect.value));
    speakTranslationButton.addEventListener('click', () => speechSynthesis.speak(translatedText, targetLanguageSelect.value));
    copyOriginalButton.addEventListener('click', () => copyToClipboard(recognizedText, 'Original text'));
    copyTranslationButton.addEventListener('click', () => copyToClipboard(translatedText, 'Translation'));
    saveApiKeyButton.addEventListener('click', saveApiKey);
    
    // API Key handling
    function saveApiKey() {
        const key = apiKeyInput.value.trim();
        if (key === '') {
            apiKeyStatus.textContent = 'Please enter a valid API key';
            apiKeyStatus.style.color = 'red';
            return;
        }
        
        if (translationService.setApiKey(key)) {
            apiKeyInput.value = '************'; // Replace with asterisks for security
            apiKeyStatus.textContent = 'API key saved successfully';
            apiKeyStatus.style.color = 'green';
            
            // Clear any previous error messages
            errorMessageElement.textContent = '';
        } else {
            apiKeyStatus.textContent = 'Invalid API key format';
            apiKeyStatus.style.color = 'red';
        }
    }
    
    // Speech recognition events
    speechRecognition.onInterimResult = (interimTranscript) => {
        const displayText = recognizedText + (interimTranscript ? ` <i>${interimTranscript}</i>` : '');
        originalTextElement.innerHTML = displayText || '<i>Listening...</i>';
    };
    
    speechRecognition.onFinalResult = (finalTranscript) => {
        recognizedText = finalTranscript;
        originalTextElement.textContent = recognizedText;
        
        // Enable buttons if we have text
        if (recognizedText) {
            speakOriginalButton.disabled = false;
            copyOriginalButton.disabled = false;
        }
    };
    
    speechRecognition.onDetectedLanguage = (detectedLang) => {
        if (sourceLanguageSelect.value === 'auto' && detectedLang) {
            detectedLanguageElement.textContent = `Detected language: ${getLanguageName(detectedLang)}`;
        }
    };
    
    speechRecognition.onError = (error) => {
        console.error('Recognition error:', error);
        errorMessageElement.textContent = `Speech recognition error: ${error}`;
        resetRecordingState();
    };
    
    // Functions
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
    
    function startRecording() {
        try {
            // Reset previous data
            audioChunks = [];
            recognizedText = '';
            translatedText = '';
            originalTextElement.textContent = '';
            translationTextElement.textContent = '';
            detectedLanguageElement.textContent = '';
            errorMessageElement.textContent = '';
            
            // Update UI
            recordButton.classList.add('recording');
            recordButton.innerHTML = '<i class="fas fa-stop"></i>';
            statusElement.textContent = 'Listening...';
            isRecording = true;
            
            // Start speech recognition
            speechRecognition.start(sourceLanguageSelect.value);
            
            // Set up audio visualization
            setupAudioVisualization();
            
        } catch (err) {
            console.error('Error starting recording:', err);
            errorMessageElement.textContent = `Error starting recording: ${err.message}`;
            resetRecordingState();
        }
    }
    
    function stopRecording() {
        if (isRecording) {
            // Stop recording
            speechRecognition.stop();
            
            // Stop audio visualization
            if (window.audioContext && window.audioContext.state !== 'closed') {
                cancelAnimationFrame(window.visualizerAnimation);
                window.audioContext.close();
            }
            
            // Reset audio bars
            audioBars.forEach(bar => {
                bar.style.height = '5px';
            });
            
            // Update UI
            resetRecordingState();
            statusElement.textContent = 'Processing translation...';
            
            // If we have recognized text, translate it
            if (recognizedText) {
                translateText(recognizedText);
            } else {
                statusElement.textContent = 'No speech detected. Try again.';
            }
        }
    }
    
    function resetRecordingState() {
        recordButton.classList.remove('recording');
        recordButton.innerHTML = '<i class="fas fa-microphone"></i>';
        isRecording = false;
    }
    
    function setupAudioVisualization() {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = window.audioContext.createAnalyser();
                const source = window.audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                function updateVisualization() {
                    if (!isRecording) return;
                    
                    window.visualizerAnimation = requestAnimationFrame(updateVisualization);
                    analyser.getByteFrequencyData(dataArray);
                    
                    // Use only a subset of frequency data for visualization
                    const barCount = audioBars.length;
                    const step = Math.floor(bufferLength / barCount);
                    
                    for (let i = 0; i < barCount; i++) {
                        const barIndex = i * step;
                        let value = dataArray[barIndex] / 2; // Scale to reasonable values
                        
                        // Make sure the visualization is responsive
                        if (value < 5) value = 5;  // Minimum height
                        if (value > 50) value = 50; // Maximum height
                        
                        audioBars[i].style.height = `${value}px`;
                    }
                }
                
                updateVisualization();
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
                errorMessageElement.textContent = `Error accessing microphone: ${err.message}`;
            });
    }
    
    function translateText(text) {
        if (!text) return;
        
        // Check if API key is set
        if (!translationService.hasApiKey()) {
            errorMessageElement.textContent = 'Google Translate API key is required. Please enter your API key.';
            statusElement.textContent = 'Translation failed - API key missing';
            return;
        }
        
        statusElement.textContent = 'Translating...';
        
        // Clear previous translations
        translationTextElement.textContent = '';
        translationTextElement.classList.remove('fade-in');
        
        // Call the translation service
        translationService.translate(text, sourceLanguageSelect.value, targetLanguageSelect.value)
            .then(result => {
                translatedText = result;
                translationTextElement.textContent = result;
                translationTextElement.classList.add('fade-in');
                
                // Enable buttons
                speakTranslationButton.disabled = false;
                copyTranslationButton.disabled = false;
                
                statusElement.textContent = 'Translation complete';
            })
            .catch(error => {
                errorMessageElement.textContent = `Translation error: ${error.message}`;
                statusElement.textContent = 'Translation failed';
                
                // If API key error, prompt the user
                if (error.message.includes('API key')) {
                    apiKeyStatus.textContent = 'Invalid API key. Please check and try again.';
                    apiKeyStatus.style.color = 'red';
                    apiKeyInput.value = '';
                }
            });
    }
    
    function copyToClipboard(text, label) {
        if (!text) return;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                statusElement.textContent = `${label} copied to clipboard`;
                setTimeout(() => {
                    statusElement.textContent = 'Ready to translate';
                }, 2000);
            })
            .catch(err => {
                errorMessageElement.textContent = `Could not copy text: ${err.message}`;
            });
    }
    
    function swapLanguages() {
        // Only swap if source language is not "auto"
        if (sourceLanguageSelect.value !== 'auto') {
            const tempLang = sourceLanguageSelect.value;
            sourceLanguageSelect.value = targetLanguageSelect.value;
            targetLanguageSelect.value = tempLang;
            
            // If we already have a translation, swap the texts too
            if (recognizedText && translatedText) {
                const tempText = recognizedText;
                recognizedText = translatedText;
                translatedText = tempText;
                
                originalTextElement.textContent = recognizedText;
                translationTextElement.textContent = translatedText;
            }
        }
    }
    
    function getLanguageName(langCode) {
        // Extract the main language code (e.g., 'en-US' -> 'en')
        const mainCode = langCode.split('-')[0];
        
        const languageNames = {
            'auto': 'Auto-detect',
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'nl': 'Dutch',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi'
        };
        
        return languageNames[mainCode] || langCode;
    }
});