# Translator-Buddy
# Voice Translation Web App (soon to be standalone device)

A web-based application that captures speech input, translates it to another language, and outputs the translation as both text and speech.

## Features

- **Real-time Speech Recognition**: Captures and transcribes speech in real-time
- **Language Translation**: Converts text from one language to another
- **Text-to-Speech Synthesis**: Speaks translated text in the target language
- **Multiple Language Support**: Works with 13 common languages
- **Audio Visualization**: Visual representation of audio input levels
- **Responsive Design**: Works across desktop and mobile devices

## Demo

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, Firefox, or Safari)
- API key from a translation service provider (for production use)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voice-translation-app.git
cd voice-translation-app
```

2. Open `index.html` in your browser or serve it with a basic HTTP server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

3. Allow microphone access when prompted and start speaking.

## Usage

1. **Select Languages**: Choose the source and target languages from the dropdown menus
2. **Record Speech**: Click the microphone button and start speaking
3. **View Translation**: Your speech will be transcribed and translated in real-time
4. **Playback**: Use the play buttons to hear both original and translated text
5. **Copy Text**: Copy either the original or translated text to your clipboard

## Customization

### Changing Translation Services

The app is designed to work with any translation API. To implement your chosen service:

1. Open `index.html` and locate the `simulateTranslation()` function
2. Replace the function with code that calls your preferred translation API
3. Add your API key securely (preferably through a backend proxy)

### Adding More Languages

To add support for additional languages:

1. Update the language dropdown options in the HTML
2. Ensure your chosen translation API supports the added languages

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Speech Recognition**: Web Speech API
- **Speech Synthesis**: Web Speech API
- **Audio Processing**: Web Audio API

## Limitations

- Speech recognition accuracy varies by language and dialect
- Browser support for Web Speech API is not universal (most reliable in Chrome)
- Free tier translation APIs typically have usage limits

## Roadmap

- [ ] Add backend service for secure API key management
- [ ] Implement user accounts and translation history
- [ ] Add support for file uploads (audio/video)
- [ ] Improve noise cancellation capabilities
- [ ] Add conversation mode for two-way translation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Web Speech API for enabling speech recognition and synthesis
- FontAwesome for the icon set
- Translation service partners
