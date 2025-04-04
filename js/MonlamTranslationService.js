// Monlam.ai Translation Integration for Translator-Buddy
// This file provides a wrapper to integrate Monlam.ai for Tibetan language translations

class MonlamTranslationService {
    constructor() {
        // Create a modal for Monlam.ai iframe
        this.createMonlamModal();
        
        // Track state
        this.isModalOpen = false;
        this.pendingTranslation = null;
        this.translationCallback = null;
    }
    
    // Create the Monlam.ai modal that will contain the iframe
    createMonlamModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'monlamModal';
        modal.className = 'monlam-modal';
        modal.style.display = 'none';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'monlam-modal-content';
        
        // Create close button
        const closeButton = document.createElement('span');
        closeButton.className = 'monlam-close-btn';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.closeModal());
        
        // Create header
        const header = document.createElement('div');
        header.className = 'monlam-modal-header';
        header.innerHTML = '<h2>Monlam.ai Tibetan Translation</h2>';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'monlamIframe';
        iframe.src = 'https://monlam.ai/model/mt';
        iframe.className = 'monlam-iframe';
        iframe.allow = 'clipboard-write';
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'monlam-buttons';
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'monlam-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy Translation';
        copyButton.addEventListener('click', () => this.copyTranslationFromIframe());
        
        // Create done button
        const doneButton = document.createElement('button');
        doneButton.className = 'monlam-btn monlam-primary-btn';
        doneButton.innerHTML = 'Done';
        doneButton.addEventListener('click', () => this.completeTranslation());
        
        // Assemble modal
        buttonsContainer.appendChild(copyButton);
        buttonsContainer.appendChild(doneButton);
        modalContent.appendChild(closeButton);
        modalContent.appendChild(header);
        modalContent.appendChild(iframe);
        modalContent.appendChild(buttonsContainer);
        modal.appendChild(modalContent);
        
        // Add CSS to the document
        this.addModalStyles();
        
        // Append modal to body
        document.body.appendChild(modal);
    }
    
    // Add necessary CSS for the modal
    addModalStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.textContent = `
            .monlam-modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                overflow: auto;
            }
            
            .monlam-modal-content {
                background-color: white;
                margin: 5% auto;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                width: 90%;
                max-width: 900px;
                position: relative;
                display: flex;
                flex-direction: column;
                height: 85vh;
            }
            
            .monlam-close-btn {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                position: absolute;
                right: 20px;
                top: 10px;
                cursor: pointer;
            }
            
            .monlam-close-btn:hover {
                color: black;
                text-decoration: none;
            }
            
            .monlam-modal-header {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .monlam-modal-header h2 {
                margin: 0;
                font-size: 1.5rem;
                color: var(--primary, #5b7cfa);
            }
            
            .monlam-iframe {
                border: none;
                width: 100%;
                flex-grow: 1;
                min-height: 300px;
                border-radius: 8px;
                background-color: white;
                margin-bottom: 15px;
            }
            
            .monlam-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding-top: 10px;
                border-top: 1px solid #e5e7eb;
            }
            
            .monlam-btn {
                padding: 10px 18px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background-color: white;
                font-family: inherit;
                font-size: 0.9rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
            }
            
            .monlam-btn:hover {
                background-color: #f3f4f6;
            }
            
            .monlam-primary-btn {
                background-color: var(--primary, #5b7cfa);
                color: white;
                border: none;
            }
            
            .monlam-primary-btn:hover {
                background-color: var(--primary-dark, #4a69e5);
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    // Open the Monlam.ai modal and begin translation
    async translate(text, sourceLang, targetLang) {
        return new Promise((resolve, reject) => {
            // Only use Monlam for Tibetan translations
            if (sourceLang !== 'bo' && targetLang !== 'bo') {
                reject(new Error('Monlam integration is only for Tibetan language'));
                return;
            }
            
            // Store the pending translation request
            this.pendingTranslation = {
                text,
                sourceLang,
                targetLang
            };
            
            // Store the callback for when translation is done
            this.translationCallback = (result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('Translation was cancelled'));
                }
            };
            
            // Open the modal
            this.openModal();
        });
    }
    
    // Open the modal and set up the translation
    openModal() {
        const modal = document.getElementById('monlamModal');
        const iframe = document.getElementById('monlamIframe');
        
        if (modal && this.pendingTranslation) {
            // Display the modal
            modal.style.display = 'block';
            this.isModalOpen = true;
            
            // Once the iframe is loaded, we'll populate it with our text
            iframe.onload = () => {
                this.populateMonlamTranslator();
            };
            
            // If iframe is already loaded, populate it now
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                this.populateMonlamTranslator();
            }
        }
    }
    
    // Close the modal
    closeModal() {
        const modal = document.getElementById('monlamModal');
        if (modal) {
            modal.style.display = 'none';
            this.isModalOpen = false;
            
            // If there's a pending translation and callback, complete it with null
            if (this.pendingTranslation && this.translationCallback) {
                this.translationCallback(null);
                this.pendingTranslation = null;
                this.translationCallback = null;
            }
        }
    }
    
    // Try to populate the Monlam translator with our text
    populateMonlamTranslator() {
        if (!this.pendingTranslation) return;
        
        const iframe = document.getElementById('monlamIframe');
        if (!iframe || !iframe.contentWindow) return;
        
        try {
            // Wait a moment for iframe content to fully initialize
            setTimeout(() => {
                // Try to find input elements in the iframe
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                // Look for the input textarea
                const inputArea = iframeDoc.querySelector('textarea');
                if (inputArea) {
                    // Set the input text
                    inputArea.value = this.pendingTranslation.text;
                    
                    // Trigger input event to make the website process it
                    const inputEvent = new Event('input', { bubbles: true });
                    inputArea.dispatchEvent(inputEvent);
                    
                    console.log('Text populated in Monlam.ai translator');
                }
                
                // Try to set the correct language direction
                if (this.pendingTranslation.sourceLang === 'bo') {
                    // Tibetan to other language (default)
                } else {
                    // Other language to Tibetan (need to click swap button)
                    const swapBtn = iframeDoc.querySelector('button[aria-label="Swap source with target language"]');
                    if (swapBtn) {
                        swapBtn.click();
                    }
                }
            }, 1500);
        } catch (error) {
            console.error('Error populating Monlam translator:', error);
        }
    }
    
    // Copy the translation from the iframe
    copyTranslationFromIframe() {
        const iframe = document.getElementById('monlamIframe');
        if (!iframe || !iframe.contentWindow) return;
        
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Find the output text area
            const outputElements = iframeDoc.querySelectorAll('textarea');
            if (outputElements.length >= 2) {
                // Typically the second textarea is the output
                const outputText = outputElements[1].value;
                
                // Copy to clipboard
                navigator.clipboard.writeText(outputText)
                    .then(() => {
                        alert('Translation copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                    });
            }
        } catch (error) {
            console.error('Error copying translation:', error);
        }
    }
    
    // Complete the translation process
    completeTranslation() {
        if (!this.pendingTranslation || !this.translationCallback) {
            this.closeModal();
            return;
        }
        
        const iframe = document.getElementById('monlamIframe');
        if (!iframe || !iframe.contentWindow) {
            this.closeModal();
            return;
        }
        
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Find the output text area
            const outputElements = iframeDoc.querySelectorAll('textarea');
            if (outputElements.length >= 2) {
                // Typically the second textarea is the output
                const outputText = outputElements[1].value;
                
                // Complete the translation with the result
                this.translationCallback(outputText);
                this.pendingTranslation = null;
                this.translationCallback = null;
            } else {
                // If we can't find the output, reject the promise
                this.translationCallback(null);
                this.pendingTranslation = null;
                this.translationCallback = null;
            }
        } catch (error) {
            console.error('Error completing translation:', error);
            this.translationCallback(null);
            this.pendingTranslation = null;
            this.translationCallback = null;
        }
        
        // Close the modal
        this.closeModal();
    }
}