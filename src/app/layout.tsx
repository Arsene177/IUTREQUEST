import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ChatbotWidget from '@/components/ChatbotWidget';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <ChatbotWidget />
        </AuthProvider>
        {/* Supprime le bouton flottant Next.js en dev */}
        <style>{`
          nextjs-portal { display: none !important; }
        `}</style>
      </body>
    </html>
  );
}