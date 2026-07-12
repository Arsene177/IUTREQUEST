import faqData from './faq.json';
import { isGroqEnabled, queryGroqAI } from './groq-service';

// Types
export type ChatbotState =
  | 'INITIAL'
  | 'GREETING'
  | 'IDENTIFY_NEED'
  | 'FAQ_SEARCH'
  | 'GUIDE_EFFET_ACADEMIQUE'
  | 'GUIDE_CORRECTION_NOM'
  | 'GUIDE_CONTESTATION_NOTE'
  | 'FAREWELL';

export interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
  quickReplies?: string[];
  redirectUrl?: string;
}

export interface ChatSession {
  sessionId: string;
  userId?: string;
  state: ChatbotState;
  history: ChatMessage[];
  context: Record<string, any>;
  lastUpdated: number;
}

// In-memory store (Replace with Redis or DB in production if needed)
const sessions: Record<string, ChatSession> = {};

// Keywords matching
const containsKeywords = (text: string, keywords: string[]): boolean => {
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
};

// Main Engine Function
export const processMessage = async (
  sessionId: string,
  message: string,
  userId?: string
): Promise<ChatMessage> => {
  // Initialize session if not exists
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      sessionId,
      userId,
      state: 'INITIAL',
      history: [],
      context: {},
      lastUpdated: Date.now()
    };
  }

  const session = sessions[sessionId];
  session.lastUpdated = Date.now();
  if (userId) session.userId = userId; // Update user ID if provided

  // Add user message to history
  if (message) {
    session.history.push({ role: 'user', content: message });
  }

  const lowerMessage = message.trim().toLowerCase();
  let botResponse: ChatMessage = { role: 'bot', content: 'Je ne suis pas sûr de comprendre.' };

  // Global reset commands
  if (lowerMessage === 'menu' || lowerMessage === 'recommencer' || lowerMessage === 'accueil') {
    session.state = 'IDENTIFY_NEED';
  }

  // State Machine
  switch (session.state) {
    case 'INITIAL':
    case 'GREETING':
      botResponse = {
        role: 'bot',
        content: "Bonjour ! Je suis l'assistant virtuel de l'IUT. Comment puis-je vous aider aujourd'hui ?",
        quickReplies: [
          'J\'ai une question (FAQ)',
          'Faire une requête d\'Effet académique',
          'Faire une requête de Correction de nom',
          'Faire une requête de Contestation de note'
        ]
      };
      session.state = 'IDENTIFY_NEED';
      break;

    case 'IDENTIFY_NEED':
      if (lowerMessage.includes('faq') || lowerMessage.includes('question')) {
        botResponse = {
          role: 'bot',
          content: "Posez-moi votre question concernant les procédures, délais ou contacts, et je chercherai dans notre FAQ."
        };
        session.state = 'FAQ_SEARCH';
      } else if (lowerMessage.includes('effet') || lowerMessage.includes('académique') || lowerMessage.includes('absence')) {
        session.state = 'GUIDE_EFFET_ACADEMIQUE';
        botResponse = getGuideEffetAcademique();
      } else if (lowerMessage.includes('nom') || lowerMessage.includes('correction')) {
        session.state = 'GUIDE_CORRECTION_NOM';
        botResponse = getGuideCorrectionNom();
      } else if (lowerMessage.includes('note') || lowerMessage.includes('contestation')) {
        session.state = 'GUIDE_CONTESTATION_NOTE';
        botResponse = getGuideContestationNote();
      } else {
        // Fallback to FAQ search if no exact match
        botResponse = searchFAQ(message);
        botResponse.quickReplies = ['Retour au menu'];
        session.state = 'FAQ_SEARCH';
      }
      break;

    case 'FAQ_SEARCH':
      if (lowerMessage === 'retour au menu') {
        session.state = 'IDENTIFY_NEED';
        botResponse = {
          role: 'bot',
          content: "Comment puis-je vous aider ?",
          quickReplies: [
            'J\'ai une question (FAQ)',
            'Faire une requête d\'Effet académique',
            'Faire une requête de Correction de nom',
            'Faire une requête de Contestation de note'
          ]
        };
      } else {
        botResponse = await answerFaqOrGroq(message);
        botResponse.quickReplies = ['Retour au menu'];
      }
      break;

    case 'GUIDE_EFFET_ACADEMIQUE':
      if (lowerMessage === 'remplir le formulaire') {
        botResponse = {
          role: 'bot',
          content: "Très bien, je vous redirige vers le formulaire de demande d'effet académique.",
          redirectUrl: '/etudiant/requetes/nouvelle?type=effet_academique',
          quickReplies: ['Retour au menu']
        };
      } else {
        botResponse = {
          role: 'bot',
          content: "Avez-vous d'autres questions ou souhaitez-vous accéder au formulaire ?",
          quickReplies: ['Remplir le formulaire', 'Retour au menu']
        };
      }
      break;

    case 'GUIDE_CORRECTION_NOM':
      if (lowerMessage === 'remplir le formulaire') {
        botResponse = {
          role: 'bot',
          content: "Très bien, je vous redirige vers le formulaire de demande de correction de nom.",
          redirectUrl: '/etudiant/requetes/nouvelle?type=correction_nom',
          quickReplies: ['Retour au menu']
        };
      } else {
        botResponse = {
          role: 'bot',
          content: "Avez-vous d'autres questions ou souhaitez-vous accéder au formulaire ?",
          quickReplies: ['Remplir le formulaire', 'Retour au menu']
        };
      }
      break;

    case 'GUIDE_CONTESTATION_NOTE':
      if (lowerMessage === 'remplir le formulaire') {
        botResponse = {
          role: 'bot',
          content: "Très bien, je vous redirige vers le formulaire de demande de contestation de note.",
          redirectUrl: '/etudiant/requetes/nouvelle?type=contestation_note',
          quickReplies: ['Retour au menu']
        };
      } else {
        botResponse = {
          role: 'bot',
          content: "Avez-vous d'autres questions ou souhaitez-vous accéder au formulaire ?",
          quickReplies: ['Remplir le formulaire', 'Retour au menu']
        };
      }
      break;

    default:
      botResponse = {
        role: 'bot',
        content: "Je suis désolé, je suis un peu perdu. Recommençons.",
        quickReplies: ['Menu']
      };
      session.state = 'IDENTIFY_NEED';
      break;
  }

  // Add bot response to history
  session.history.push(botResponse);

  return botResponse;
};

async function answerFaqOrGroq(query: string): Promise<ChatMessage> {
  const faqResponse = searchFAQ(query);
  if (faqResponse.content.startsWith('Voici ce que j\'ai trouvé')) {
    return faqResponse;
  }

  if (isGroqEnabled()) {
    try {
      const groqAnswer = await queryGroqAI(query);
      return {
        role: 'bot',
        content: groqAnswer
      };
    } catch (error) {
      console.error('Groq AI error:', error);
      return {
        role: 'bot',
        content: "Je n'ai pas trouvé de réponse dans ma base de connaissances et le service AI est momentanément indisponible. Essayez de reformuler ou contactez le secrétariat de l'IUT." 
      };
    }
  }

  return {
    role: 'bot',
    content: "Je n'ai pas trouvé de réponse exacte à votre question dans ma base de connaissances. Essayez de reformuler ou contactez le secrétariat de l'IUT pour plus d'informations."
  };
}

// Helpers for Guides
function getGuideEffetAcademique(): ChatMessage {
  return {
    role: 'bot',
    content: "Une requête d'Effet académique permet de justifier une absence à un cours ou examen. Vous aurez besoin de fournir un justificatif (ex: certificat médical) dans un délai de 48h. Souhaitez-vous remplir le formulaire maintenant ?",
    quickReplies: ['Remplir le formulaire', 'Retour au menu']
  };
}

function getGuideCorrectionNom(): ChatMessage {
  return {
    role: 'bot',
    content: "Une requête de Correction de nom permet de modifier une erreur d'orthographe sur vos documents scolaires. Vous devrez fournir une pièce d'identité valide (carte d'identité, passeport). Souhaitez-vous remplir le formulaire maintenant ?",
    quickReplies: ['Remplir le formulaire', 'Retour au menu']
  };
}

function getGuideContestationNote(): ChatMessage {
  return {
    role: 'bot',
    content: "Avant de soumettre une Contestation de note, assurez-vous d'avoir d'abord discuté avec votre professeur. Si le désaccord persiste, vous pouvez soumettre une requête officielle. Souhaitez-vous remplir le formulaire maintenant ?",
    quickReplies: ['Remplir le formulaire', 'Retour au menu']
  };
}

function searchFAQ(query: string): ChatMessage {
  // Simple scoring based on keywords
  let bestMatch = null;
  let highestScore = 0;

  for (const item of faqData) {
    let score = 0;
    for (const kw of item.keywords) {
      if (query.toLowerCase().includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return {
      role: 'bot',
      content: `Voici ce que j'ai trouvé : ${bestMatch.answer}`
    };
  }

  return {
    role: 'bot',
    content: "Je n'ai pas trouvé de réponse exacte à votre question dans ma base de connaissances. Essayez de reformuler ou contactez le secrétariat de l'IUT pour plus d'informations."
  };
}
