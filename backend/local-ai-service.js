require('dotenv').config();

// Default to local Jakarta EE server URL
const DEFAULT_URL = 'http://localhost:8080/darija-translator-service/api/translate';

async function translateText(text) {
    const javaServerUrl = process.env.LOCAL_AI_URL || DEFAULT_URL;

    console.log(`Sending translation request to Java Server: ${javaServerUrl}`);

    try {
        const response = await fetch(javaServerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                script: "latin" // Default to latin script for now
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Java Server Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('Java Server Response:', data);

        // Try to find the translation in likely fields
        // We don't have the TranslationResponse DTO definition, so we check common names
        const translation = data.translation || data.translatedText || data.result || data.message;

        if (!translation) {
            console.warn('Unknown response structure:', data);
            return typeof data === 'string' ? data : JSON.stringify(data);
        }

        return translation;

    } catch (error) {
        console.error("Local Java AI Service Error:", error);
        throw new Error("Erreur de communication avec le serveur de traduction local.");
    }
}

module.exports = { translateText };
