import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'JANNGO — IUT de Douala',
  description: 'Système de gestion des requêtes étudiantes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            <ChatbotWidget />
          </ToastProvider>
        </AuthProvider>
        {/* Supprime le bouton flottant Next.js en dev */}
        <style>{`
          nextjs-portal { display: none !important; }
        `}</style>
      </body>
    </html>
  );
}