// Types
export type ChatbotState =
  | 'ACCUEIL'
  | 'EFFET_ACADEMIQUE'
  | 'REDIRECT_EFFET'
  | 'CORRECTION_NOM'
  | 'REDIRECT_NOM'
  | 'CONTESTATION_NOTE'
  | 'REDIRECT_NOTE'
  | 'AIDE';

export interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
  quickReplies?: string[];
  redirectTo?: string;
}

export interface ChatSession {
  sessionId: string;
  userId?: string;
  state: ChatbotState;
  history: ChatMessage[];
  lastUpdated: number;
}

// In-memory store (Replace with Redis or DB in production if needed)
const sessions: Record<string, ChatSession> = {};

const QUICK_REPLY_MENU = '🏠 Menu principal';

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

// --- Réponses des états ---

function accueilResponse(): ChatMessage {
  return {
    role: 'bot',
    content: "Bonjour ! Je suis l'assistant JANNGO. Comment puis-je vous aider ?",
    quickReplies: ['📄 Effet Académique', '✏️ Correction de Nom', '📝 Contestation de Note', '❓ Aide générale'],
  };
}

function effetAcademiqueResponse(): ChatMessage {
  return {
    role: 'bot',
    content:
      "Une requête d'Effet Académique vous permet d'obtenir un certificat de scolarité, un relevé de notes, une attestation de scolarité ou un diplôme auprès de l'administration de l'IUT de Douala.\n\nDocuments requis :\n• Quitus\n• Profil étudiant\n• CNI\n• Lettre adressée au directeur\n\nSouhaitez-vous remplir le formulaire ?",
    quickReplies: ['✅ Remplir le formulaire', QUICK_REPLY_MENU],
  };
}

function redirectEffetResponse(): ChatMessage {
  return {
    role: 'bot',
    content: "Je vous redirige vers le formulaire de demande d'Effet Académique.",
    redirectTo: '/requetes/nouvelle/effet-academique',
    quickReplies: [],
  };
}

function correctionNomResponse(): ChatMessage {
  return {
    role: 'bot',
    content:
      "Une requête de Correction de Nom vous permet de corriger une erreur orthographique sur votre nom dans les registres de l'IUT.\n\nDocuments requis :\n• Quitus\n• Lettre adressée au directeur\n\nSouhaitez-vous remplir le formulaire ?",
    quickReplies: ['✅ Remplir le formulaire', QUICK_REPLY_MENU],
  };
}

function redirectNomResponse(): ChatMessage {
  return {
    role: 'bot',
    content: "Je vous redirige vers le formulaire de correction de nom.",
    redirectTo: '/requetes/nouvelle/correction-nom',
    quickReplies: [],
  };
}

function contestationNoteResponse(): ChatMessage {
  return {
    role: 'bot',
    content:
      "Une requête de Contestation de Note vous permet de contester une note que vous estimez incorrecte.\n\nDocuments requis :\n• Fiche de requête\n• Feuille de note (si disponible)\n\nSouhaitez-vous remplir le formulaire ?",
    quickReplies: ['✅ Remplir le formulaire', QUICK_REPLY_MENU],
  };
}

function redirectNoteResponse(): ChatMessage {
  return {
    role: 'bot',
    content: "Je vous redirige vers le formulaire de contestation de note.",
    redirectTo: '/requetes/nouvelle/contestation-note',
    quickReplies: [],
  };
}

function aideResponse(): ChatMessage {
  return {
    role: 'bot',
    content:
      "Je peux vous aider avec :\n\n• 📄 Effet Académique : obtenir certificats, relevés, attestations\n• ✏️ Correction de Nom : corriger une erreur sur votre nom\n• 📝 Contestation de Note : contester une note incorrecte\n\nQue souhaitez-vous faire ?",
    quickReplies: ['📄 Effet Académique', '✏️ Correction de Nom', '📝 Contestation de Note', QUICK_REPLY_MENU],
  };
}

function matchEffetAcademique(text: string): boolean {
  return matchesAny(text, ['effet académique', 'effet academique', 'effet', 'academique', 'académique']);
}

function matchCorrectionNom(text: string): boolean {
  return matchesAny(text, ['correction de nom', 'correction', 'nom']);
}

function matchContestationNote(text: string): boolean {
  return matchesAny(text, ['contestation de note', 'contestation', 'note']);
}

function matchAideGenerale(text: string): boolean {
  return matchesAny(text, ['aide générale', 'aide generale', 'aide', 'help']);
}

function matchRemplirFormulaire(text: string): boolean {
  return matchesAny(text, ['remplir le formulaire', 'remplir', 'formulaire']);
}

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
      state: 'ACCUEIL',
      history: [],
      lastUpdated: Date.now(),
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
  let botResponse: ChatMessage;

  // Message vide (ouverture du widget) : affiche l'accueil sans autre traitement.
  if (!message.trim()) {
    session.state = 'ACCUEIL';
    botResponse = accueilResponse();
    session.history.push(botResponse);
    return botResponse;
  }

  // Retour au menu principal depuis n'importe quel état.
  if (lowerMessage.includes('menu') || message.includes('🏠')) {
    session.state = 'ACCUEIL';
    botResponse = accueilResponse();
    session.history.push(botResponse);
    return botResponse;
  }

  switch (session.state) {
    case 'ACCUEIL':
      if (matchEffetAcademique(lowerMessage)) {
        session.state = 'EFFET_ACADEMIQUE';
        botResponse = effetAcademiqueResponse();
      } else if (matchCorrectionNom(lowerMessage)) {
        session.state = 'CORRECTION_NOM';
        botResponse = correctionNomResponse();
      } else if (matchContestationNote(lowerMessage)) {
        session.state = 'CONTESTATION_NOTE';
        botResponse = contestationNoteResponse();
      } else if (matchAideGenerale(lowerMessage)) {
        session.state = 'AIDE';
        botResponse = aideResponse();
      } else {
        session.state = 'ACCUEIL';
        botResponse = accueilResponse();
      }
      break;

    case 'EFFET_ACADEMIQUE':
      if (matchRemplirFormulaire(lowerMessage)) {
        session.state = 'REDIRECT_EFFET';
        botResponse = redirectEffetResponse();
      } else {
        botResponse = effetAcademiqueResponse();
      }
      break;

    case 'CORRECTION_NOM':
      if (matchRemplirFormulaire(lowerMessage)) {
        session.state = 'REDIRECT_NOM';
        botResponse = redirectNomResponse();
      } else {
        botResponse = correctionNomResponse();
      }
      break;

    case 'CONTESTATION_NOTE':
      if (matchRemplirFormulaire(lowerMessage)) {
        session.state = 'REDIRECT_NOTE';
        botResponse = redirectNoteResponse();
      } else {
        botResponse = contestationNoteResponse();
      }
      break;

    case 'AIDE':
      if (matchEffetAcademique(lowerMessage)) {
        session.state = 'EFFET_ACADEMIQUE';
        botResponse = effetAcademiqueResponse();
      } else if (matchCorrectionNom(lowerMessage)) {
        session.state = 'CORRECTION_NOM';
        botResponse = correctionNomResponse();
      } else if (matchContestationNote(lowerMessage)) {
        session.state = 'CONTESTATION_NOTE';
        botResponse = contestationNoteResponse();
      } else {
        botResponse = aideResponse();
      }
      break;

    case 'REDIRECT_EFFET':
    case 'REDIRECT_NOM':
    case 'REDIRECT_NOTE':
    default:
      // Après une redirection (ou état inconnu), tout nouveau message ramène à l'accueil.
      session.state = 'ACCUEIL';
      botResponse = accueilResponse();
      break;
  }

  // Add bot response to history
  session.history.push(botResponse);

  return botResponse;
};
