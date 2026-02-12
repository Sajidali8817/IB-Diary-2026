// Gemini AI Service for React PWA
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const isAIConfigured = () => {
    return !!API_KEY;
};

export const generateAIResponse = async (userMessage, conversationHistory = []) => {
    if (!API_KEY) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
    }

    try {
        // Build conversation context
        const contents = conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'AI request failed');
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

        return aiText;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
};

export const checkGrammar = async (text) => {
    const prompt = `Review and correct the grammar, spelling, and punctuation of the following text while keeping the meaning identical. Only return the corrected text, nothing else: "${text}"`;
    return await generateAIResponse(prompt);
};

export default {
    isAIConfigured,
    generateAIResponse,
    checkGrammar,
};
