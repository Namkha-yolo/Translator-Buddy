module.exports = {
    // Translation service to use: 'google', 'azure', 'deepl', or 'libre'
    translationService: process.env.TRANSLATION_SERVICE || 'google',
    
    // Google Cloud Translation API
    googleApiKey: process.env.GOOGLE_API_KEY,
    
    // Microsoft Azure Translator
    azureApiKey: process.env.AZURE_API_KEY,
    azureEndpoint: process.env.AZURE_ENDPOINT || 'https://api.cognitive.microsofttranslator.com',
    azureRegion: process.env.AZURE_REGION || 'global',
    
    // DeepL API
    deeplApiKey: process.env.DEEPL_API_KEY,
    
    // LibreTranslate API
    libreApiKey: process.env.LIBRE_API_KEY,
    libreApiUrl: process.env.LIBRE_API_URL,
    
    // Application settings
    corsOrigin: process.env.CORS_ORIGIN || '*'
};