"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-client";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
  quickReplies?: string[];
  redirectUrl?: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID on mount
  useEffect(() => {
    let sid = sessionStorage.getItem("chatbot_session_id");
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("chatbot_session_id", sid);
    }
    setSessionId(sid);

    // Load history from session storage if exists
    const history = sessionStorage.getItem("chatbot_history");
    if (history) {
      try {
        setMessages(JSON.parse(history));
      } catch (e) {
        // failed to parse
      }
    }
  }, []);

  // Save history to session storage when updated
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("chatbot_history", JSON.stringify(messages));
    }
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

      if (botMessage.redirectUrl) {
        // Optionally auto-redirect, or let the user click a link.
        // For now, we just append a link to the message content if there is a redirect
        // Actually, we'll render it as a link in the UI.
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
    // Send initial empty message to trigger greeting if no history
    if (messages.length === 0 && sessionId) {
      sendMessage("");
    }
  };

  return (
    // bottom-24 sur mobile : laisse la bottom nav (Sidebar) et son bouton
    // "Quitter" libres de clics ; le bouton flottant remonte au-dessus.
    <div className="fixed bottom-24 right-4 sm:right-6 lg:bottom-6 z-30">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[500px] max-h-[70vh] flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} />
              <h3 className="font-semibold text-lg">Assistant IUT</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
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
                  {msg.redirectUrl && (
                    <a
                      href={msg.redirectUrl}
                      className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium hover:bg-blue-200 transition-colors"
                    >
                      Aller au formulaire →
                    </a>
                  )}
                </div>

                {/* Quick Replies (only show for the latest bot message) */}
                {msg.role === "bot" &&
                  msg.quickReplies &&
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

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
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
