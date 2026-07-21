import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { DarkModeProvider } from '@/context/DarkModeContext';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'IUTRequest — IUT de Douala',
  description: 'Système de gestion des requêtes étudiantes',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

// Applique la classe 'dark' avant l'hydratation pour éviter un flash de thème clair.
const DARK_MODE_INIT_SCRIPT = `
  try {
    if (localStorage.getItem('iutrequest_dark_mode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: DARK_MODE_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-100">
        <AuthProvider>
          <DarkModeProvider>
            <ToastProvider>
              {children}
              <ChatbotWidget />
            </ToastProvider>
          </DarkModeProvider>
        </AuthProvider>
        {/* Supprime le bouton flottant Next.js en dev */}
        <style>{`
          nextjs-portal { display: none !important; }
        `}</style>
      </body>
    </html>
  );
}