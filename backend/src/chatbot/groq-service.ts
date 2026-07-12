/* eslint-disable @typescript-eslint/no-explicit-any */

interface GroqResponse {
  output?: any;
  result?: any;
  [key: string]: any;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq-1';

export const isGroqEnabled = (): boolean => {
  return process.env.GROQ_ENABLED === 'true' && !!GROQ_API_KEY;
};

export const buildGroqPrompt = (question: string): string => {
  return `Tu es l'assistant virtuel de l'IUT. Réponds en français de manière claire, concise et utile. Si la question concerne les démarches d'un étudiant, oriente vers les formulaires correspondants ou vers le secrétariat. Ne mentionne pas "Groq" ou des détails techniques. Question : ${question}`;
};

export const queryGroqAI = async (userQuery: string): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const prompt = buildGroqPrompt(userQuery);

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

  const data: GroqResponse = (await response.json()) as GroqResponse;

  const output = data.output ?? data.result ?? null;

  if (Array.isArray(output) && output.length > 0) {
    return String(output[0]).trim();
  }

  if (typeof output === 'string') {
    return output.trim();
  }

  throw new Error('Unexpected Groq API response format.');
};
