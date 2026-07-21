"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
  quickReplies?: string[];
  redirectTo?: string;
}

export default function ChatbotWidget() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Un nouveau sessionId (et un historique vide) est généré à chaque connexion
  // d'étudiant — si l'utilisateur change (nouvelle connexion), tout repart à zéro.
  useEffect(() => {
    if (!user) {
      setSessionId("");
      setMessages([]);
      return;
    }
    setSessionId(`session_${user.id}_${Date.now()}`);
    setMessages([]);
    setIsOpen(false);
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const botMessage: ChatMessage = await response.json();
      setMessages((prev) => [...prev, botMessage]);

      if (botMessage.redirectTo) {
        // Laisse le temps à l'étudiant de lire le message avant de naviguer.
        const destination = botMessage.redirectTo;
        setTimeout(() => {
          router.push(destination);
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Désolé, une erreur de connexion s'est produite." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0 && sessionId) {
      // Appel direct sans ajouter de message utilisateur dans l'historique
      setIsLoading(true);
      fetch(`${API_BASE_URL}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: "" }),
      })
        .then((r) => r.json())
        .then((botMessage) => {
          setMessages([botMessage]);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  // Le chatbot n'existe que pour les étudiants connectés.
  if (isAuthLoading || !user || user.role !== "etudiant") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bulle flottante */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Ouvrir l'assistant JANNGO"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Panneau de conversation */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-w-[calc(100vw-3rem)] h-[500px] flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-sm flex-shrink-0">
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} />
              <h3 className="font-semibold text-lg">Assistant JANNGO</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer l'assistant"
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Historique des messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Quick replies (uniquement sur le dernier message du bot) */}
                {msg.role === "bot" &&
                  msg.quickReplies &&
                  msg.quickReplies.length > 0 &&
                  index === messages.length - 1 && (
                    <div className="flex flex-wrap gap-2 mt-3 w-full">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickReply(reply)}
                          className="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full font-medium shadow-sm transition-colors text-left"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-bl-none shadow-sm px-4 py-3 flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Saisie */}
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputMessage);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Envoyer"
                className="bg-blue-600 text-white rounded-full p-2.5 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
