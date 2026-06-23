"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  time: string;
  quickReplies?: string[];
}

interface ChatbotApiResponse {
  reponse: string;
  quick_replies?: string[];
  intention?: string | null;
}

const MESSAGE_ACCUEIL_TEXTE =
  "👋 Bonjour ! Je suis l'assistant IUTRequest.\n\nJe peux vous aider à :\n• Connaître les pièces à fournir selon votre demande\n• Estimer les délais de traitement\n• Vous orienter vers le bon formulaire";

const SUGGESTIONS_ACCUEIL = ["Corriger mon nom", "Changer une note", "Effets académiques", "Délais de traitement"];

const ROUTES_PAR_LABEL: Record<string, string> = {
  "Corriger mon nom": "/requetes/nouvelle/correction-nom",
  "Changer une note": "/requetes/nouvelle/contestation-note",
  "Effets académiques": "/requetes/nouvelle/effet-academique",
  "Voir mes requêtes": "/dashboard",
};

function heureActuelle(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function messageAccueil(): ChatMessage {
  return {
    id: "accueil",
    role: "bot",
    content: MESSAGE_ACCUEIL_TEXTE,
    time: heureActuelle(),
    quickReplies: SUGGESTIONS_ACCUEIL,
  };
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([messageAccueil()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // Mémoire de la dernière intention détectée par le backend, pour permettre
  // des questions de suivi naturelles ("et le délai pour ça ?").
  const derniereIntentionRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const pousserMessage = (msg: Omit<ChatMessage, "id" | "time">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}`, time: heureActuelle() },
    ]);
  };

  /**
   * Envoie le message au moteur de règles du backend (voir
   * backend/src/chatbot/knowledgeBase.ts) en transmettant la dernière
   * intention détectée, pour des réponses de suivi cohérentes dans la
   * conversation.
   */
  const envoyerAuMoteur = async (texte: string) => {
    setIsTyping(true);
    try {
      const { data } = await apiClient.post<ChatbotApiResponse>("/chatbot/message", {
        message: texte,
        derniere_intention: derniereIntentionRef.current,
      });
      derniereIntentionRef.current = data.intention ?? null;
      // Petit délai pour donner une sensation de "réflexion" naturelle plutôt
      // qu'une réponse instantanée qui casse l'illusion conversationnelle.
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 400));
      pousserMessage({ role: "bot", content: data.reponse, quickReplies: data.quick_replies });
    } catch {
      pousserMessage({
        role: "bot",
        content:
          "Désolé, je rencontre une difficulté pour répondre à cette question pour le moment. Vous pouvez consulter directement « Mes requêtes » ou réessayer dans un instant.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (label: string) => {
    pousserMessage({ role: "user", content: label });
    const route = ROUTES_PAR_LABEL[label];
    if (route) {
      setIsTyping(true);
      window.setTimeout(() => {
        setIsTyping(false);
        pousserMessage({ role: "bot", content: `Je vous emmène vers : ${label.toLowerCase()}…` });
        router.push(route);
        setIsOpen(false);
      }, 450);
      return;
    }
    envoyerAuMoteur(label);
  };

  const handleSend = () => {
    const texte = input.trim();
    if (!texte || isTyping) return;
    pousserMessage({ role: "user", content: texte });
    setInput("");
    envoyerAuMoteur(texte);
  };

  const handleReset = () => {
    derniereIntentionRef.current = null;
    setMessages([messageAccueil()]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Ouvrir l'assistant IUTRequest"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--color-brand)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--color-brand-dark)] transition"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(420px,calc(100vw-2.5rem))] rounded-2xl bg-[var(--color-brand)] shadow-2xl flex flex-col max-h-[min(640px,calc(100vh-8rem))] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <div>
              <p className="text-white font-bold">Assistant IUTRequest</p>
              <p className="text-white/70 text-xs">Procédures &amp; démarches IUT</p>
            </div>
            <button
              onClick={handleReset}
              className="text-white/80 text-sm font-medium hover:text-white transition flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--color-cream-soft)] px-4 py-4 flex flex-col gap-3"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-line ${
                    msg.role === "bot"
                      ? "bg-[#2b2b33] text-white"
                      : "bg-[var(--color-brand)] text-white"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-[var(--color-ink-faint)] mt-1">{msg.time}</span>

                {msg.quickReplies && msg.quickReplies.length > 0 && !isTyping && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-full">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleQuickReply(qr)}
                        className="rounded-full bg-[var(--color-brand)] text-white text-xs font-medium px-3 py-1.5 hover:bg-[var(--color-brand-dark)] transition"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="self-start bg-[#2b2b33] text-white rounded-xl px-4 py-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" />
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Écrivez votre message…"
              disabled={isTyping}
              className="flex-1 h-11 rounded-full bg-white/95 px-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none disabled:opacity-70"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              aria-label="Envoyer"
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition flex-shrink-0 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
