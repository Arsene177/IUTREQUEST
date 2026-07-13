"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryGroqAI = exports.buildGroqPrompt = exports.isGroqEnabled = void 0;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq-1';
const isGroqEnabled = () => {
    return process.env.GROQ_ENABLED === 'true' && !!GROQ_API_KEY;
};
exports.isGroqEnabled = isGroqEnabled;
const buildGroqPrompt = (question) => {
    return `Tu es l'assistant virtuel de l'IUT. Réponds en français de manière claire, concise et utile. Si la question concerne les démarches d'un étudiant, oriente vers les formulaires correspondants ou vers le secrétariat. Ne mentionne pas "Groq" ou des détails techniques. Question : ${question}`;
};
exports.buildGroqPrompt = buildGroqPrompt;
const queryGroqAI = async (userQuery) => {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured.');
    }
    const prompt = (0, exports.buildGroqPrompt)(userQuery);
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: GROQ_MODEL, input: prompt })
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
    }
    const data = (await response.json());
    const output = data.output ?? data.result ?? null;
    if (Array.isArray(output) && output.length > 0) {
        return String(output[0]).trim();
    }
    if (typeof output === 'string') {
        return output.trim();
    }
    throw new Error('Unexpected Groq API response format.');
};
exports.queryGroqAI = queryGroqAI;
