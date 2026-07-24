import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ChatbotWidget from '@/components/ChatbotWidget';
import { NotificationsListener } from '@/components/NotificationsListener';

export const metadata: Metadata = {
  title: 'IutRequest — IUT de Douala',
  description: 'Système de gestion des requêtes étudiantes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-slate-100 antialiased transition-colors">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ChatbotWidget />
              <NotificationsListener />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* Supprime le bouton flottant Next.js en dev */}
        <style>{`
          nextjs-portal { display: none !important; }
        `}</style>
      </body>
    </html>
  );
}