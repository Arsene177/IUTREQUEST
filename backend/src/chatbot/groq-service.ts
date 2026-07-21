/* eslint-disable @typescript-eslint/no-explicit-any */

// Groq expose une API compatible OpenAI (chat completions). L'ancienne
// implémentation appelait `${GROQ_API_URL}` (sans route) avec un payload
// `{ model, input }` qui ne correspond à aucun format d'API Groq réel : tout
// appel échouait systématiquement dès que GROQ_ENABLED=true. Voir
// https://console.groq.com/docs/api-reference#chat-create pour le contrat.
interface GroqChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
  [key: string]: any;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL =
  process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
// Modèle Groq rapide et peu coûteux, adapté à des réponses FAQ courtes.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_TIMEOUT_MS = 15000;

export const isGroqEnabled = (): boolean => {
  return process.env.GROQ_ENABLED === 'true' && !!GROQ_API_KEY;
};

// Contexte métier injecté dans le prompt système pour que le modèle ne
// réponde jamais hors-sujet : types de requêtes, procédures et routes réels
// de l'application (cf. backend/src/config/init_db.sql et src/lib/constants.ts).
const SYSTEM_PROMPT = `Tu es l'assistant virtuel du système de gestion des requêtes étudiantes de l'IUT (JANNGO/IUTRequest).

Types de requêtes que peuvent soumettre les étudiants :
- Effet académique (justifier une absence, ex: certificat médical) — formulaire : /requetes/nouvelle/effet-academique
- Correction de nom (erreur d'orthographe sur les documents scolaires, pièce d'identité requise) — formulaire : /requetes/nouvelle/correction-nom
- Contestation de note (après discussion préalable avec l'enseignant) — formulaire : /requetes/nouvelle/contestation-note

Statuts possibles d'une requête : En attente, En cours, En attente d'informations, Validée, En exécution, Rejetée, Clôturée. L'étudiant suit ses requêtes depuis son tableau de bord ("Mes requêtes").

Rôles impliqués dans le traitement : secrétariat, direction adjointe, direction, département, cellule informatique, scolarité.

Consignes :
- Réponds toujours en français, de façon claire, concise et utile (3-4 phrases maximum).
- Si la question concerne une démarche, oriente précisément vers le bon type de requête et son formulaire.
- Si la question est hors sujet (ne concerne ni l'IUT, ni ses procédures administratives, ni le fonctionnement de la plateforme), rappelle poliment que tu ne réponds qu'aux questions liées aux démarches étudiantes de l'IUT.
- Ne mentionne jamais "Groq", un nom de modèle ou des détails techniques d'implémentation.`;

export const queryGroqAI = async (userQuery: string): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as GroqChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new Error('Unexpected Groq API response format.');
    }

    return content.trim();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Groq API request timed out after ${GROQ_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
