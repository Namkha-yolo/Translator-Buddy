// Application logic for Voice Translation App with simultaneous translation

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
    let interimText = '';
    let lastTranslatedLength = 0;
    let translatedText = '';
    let translationInProgress = false;
    let translationQueue = [];
    let translationDebounceTimer = null;
    const TRANSLATION_DEBOUNCE_MS = 300; // Short debounce time for quick updates
    let autoSpeakEnabled = true; // Auto-speak feature enabled by default
    let currentUtterance = null; // Track current speech synthesis utterance
    
    // Check for speech recognition support
    if (!speechRecognition.isSupported()) {
        errorMessageElement.textContent = 'Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.';
        recordButton.disabled = true;
        return;
    }
    
    // Setup silence detection callback
    speechRecognition.onSilence = () => {
        console.log("Silence detected - stopping recording");
        stopRecording();
    };
    
    // Event Listeners
    recordButton.addEventListener('click', toggleRecording);
    swapLanguagesButton.addEventListener('click', swapLanguages);
    speakOriginalButton.addEventListener('click', () => speechSynthesis.speak(recognizedText, sourceLanguageSelect.value));
    speakTranslationButton.addEventListener('click', () => speechSynthesis.speak(translatedText, targetLanguageSelect.value));
    copyOriginalButton.addEventListener('click', () => copyToClipboard(recognizedText, 'Original text'));
    copyTranslationButton.addEventListener('click', () => copyToClipboard(translatedText, 'Translation'));
    
    // Debug translation API to make sure it works
    console.log("Testing translation API...");
    translationService.translate("Hello, this is a test", "en-US", "es-ES")
        .then(result => {
            console.log("Translation API test successful:", result);
        })
        .catch(error => {
            console.error("Translation API test failed:", error);
        });
    
    // Speech recognition events
    speechRecognition.onInterimResult = (interimTranscript) => {
        interimText = interimTranscript;
        const displayText = recognizedText + (interimText ? ` <i>${interimText}</i>` : '');
        originalTextElement.innerHTML = displayText || '<i>Listening...</i>';
        
        // Continuously translate interim results for simultaneous translation
        if (interimText && interimText.length > 1) {
            const fullText = recognizedText + ' ' + interimText;
            debouncedTranslate(fullText);
        }
    };
    
    speechRecognition.onFinalResult = (finalTranscript) => {
        console.log("Final transcript:", finalTranscript);
        recognizedText += (recognizedText ? ' ' : '') + finalTranscript;
        interimText = '';
        originalTextElement.textContent = recognizedText;
        
        // Enable buttons if we have text
        if (recognizedText) {
            speakOriginalButton.disabled = false;
            copyOriginalButton.disabled = false;
            
            // Translate the final text
            debouncedTranslate(recognizedText, false); // false = not interim
        }
    };
    
    speechRecognition.onDetectedLanguage = (detectedLang) => {
        console.log("Detected language:", detectedLang);
        if (sourceLanguageSelect.value === 'auto' && detectedLang) {
            detectedLanguageElement.textContent = `Detected language: ${getLanguageName(detectedLang)}`;
        }
    };
    
    speechRecognition.onError = (error) => {
        console.error('Recognition error:', error);
        errorMessageElement.textContent = `Speech recognition error: ${error}`;
        resetRecordingState();
    };
    
    // Debounced translation function to prevent too many API calls
    function debouncedTranslate(text, isInterim = true) {
        // Don't translate if too short
        if (text.length < 2) return;
        
        // Cancel previous timer
        if (translationDebounceTimer) {
            clearTimeout(translationDebounceTimer);
            translationDebounceTimer = null;
        }
        
        // Set new timer
        translationDebounceTimer = setTimeout(() => {
            // If translation is already in progress, queue this request
            if (translationInProgress) {
                translationQueue.push({ text, isInterim });
                return;
            }
            
            translateText(text, isInterim);
        }, isInterim ? TRANSLATION_DEBOUNCE_MS : 0); // No delay for final translations
    }
    
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
            // Stop any ongoing speech
            if (autoSpeakEnabled && speechSynthesis) {
                speechSynthesis.cancel();
            }
            
            // Reset previous data
            recognizedText = '';
            interimText = '';
            translatedText = '';
            lastTranslatedLength = 0;
            originalTextElement.textContent = '';
            translationTextElement.textContent = '';
            detectedLanguageElement.textContent = '';
            errorMessageElement.textContent = '';
            translationQueue = [];
            
            // Cancel any pending translations
            if (translationDebounceTimer) {
                clearTimeout(translationDebounceTimer);
                translationDebounceTimer = null;
            }
            
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
            
            // If we have recognized text but no translation, do a final translation
            if (recognizedText && !translatedText) {
                statusElement.textContent = 'Finalizing translation...';
                translateText(recognizedText, false);
            } else if (!recognizedText) {
                statusElement.textContent = 'No speech detected. Try again.';
            } else {
                statusElement.textContent = 'Translation complete';
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
    
    function translateText(text, isInterim = false) {
        if (!text) return;
        
        // Check if translation service is available
        if (!translationService) {
            console.error("Translation service not initialized");
            if (!isInterim) errorMessageElement.textContent = "Translation service not available";
            return;
        }
        
        // Check if translate method exists
        if (typeof translationService.translate !== 'function') {
            console.error("Translation method not found");
            if (!isInterim) errorMessageElement.textContent = "Translation method not available";
            return;
        }
        
        // Mark translation as in progress
        translationInProgress = true;
        
        // Show status only for non-interim translations
        if (!isInterim) {
            statusElement.textContent = 'Translating...';
        }
        
        // Call the translation service
        translationService.translate(text, sourceLanguageSelect.value, targetLanguageSelect.value)
            .then(result => {
                translatedText = result;
                
                // Update the translation display
                translationTextElement.textContent = result;
                
                // Enable buttons
                speakTranslationButton.disabled = false;
                copyTranslationButton.disabled = false;
                
                // For non-interim (final) translations
                if (!isInterim) {
                    statusElement.textContent = 'Translation complete';
                    
                    // Auto-speak the complete translation if enabled
                    if (autoSpeakEnabled) {
                        // Cancel any ongoing speech
                        speechSynthesis.cancel();
                        // Speak the full translation
                        speechSynthesis.speak(translatedText, targetLanguageSelect.value);
                    }
                } 
                // For interim translations, speak only the new part if there's significant new content
                else if (autoSpeakEnabled && result.length > lastTranslatedLength + 5) {
                    // Try to get only the new part of the translation
                    const newPart = result.substring(lastTranslatedLength).trim();
                    if (newPart.length > 0) {
                        // Cancel any ongoing speech if we have new content
                        speechSynthesis.cancel();
                        // Speak only the new part
                        speechSynthesis.speak(newPart, targetLanguageSelect.value);
                    }
                    // Update the last translated length
                    lastTranslatedLength = result.length;
                }
                
                // Translation is no longer in progress
                translationInProgress = false;
                
                // Process next item in queue if available
                processNextTranslation();
            })
            .catch(error => {
                console.error('Translation error:', error);
                
                // Only show errors for final translations
                if (!isInterim) {
                    errorMessageElement.textContent = `Translation error: ${error.message || "Unknown error"}`;
                    statusElement.textContent = 'Translation failed';
                    translationTextElement.textContent = 'Translation failed. Please try again.';
                    
                    // Use mock translation as fallback
                    translationService.mockTranslate(text, sourceLanguageSelect.value, targetLanguageSelect.value)
                        .then(mockResult => {
                            translationTextElement.textContent = mockResult;
                            
                            // Auto-speak the mock translation if enabled
                            if (autoSpeakEnabled) {
                                speechSynthesis.speak(mockResult, targetLanguageSelect.value);
                            }
                        });
                }
                
                // Translation is no longer in progress
                translationInProgress = false;
                
                // Process next item in queue if available
                processNextTranslation();
            });
    }
    
    function processNextTranslation() {
        // Check if there are items in the queue
        if (translationQueue.length > 0) {
            // Get the most recent translation request
            const nextTranslation = translationQueue.pop();
            // Clear the rest of the queue
            translationQueue = [];
            // Process the translation
            translateText(nextTranslation.text, nextTranslation.isInterim);
        }
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
            'bo': 'Tibetan'  
        };
        
        return languageNames[mainCode] || langCode;
    }
});
