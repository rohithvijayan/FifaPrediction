import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: {
    default: 'പന്ത്ദുനിയ | Panth Duniya — World Cup 2026 Prediction',
    template: '%s | Panth Duniya',
  },
  description:
    'Predict FIFA World Cup 2026 matches, earn points, and climb the global leaderboard. Free to play — built for Keralites.',
  keywords: ['FIFA World Cup 2026', 'football prediction', 'Panth Duniya', 'പന്ത്ദുനിയ', 'leaderboard'],
  openGraph: {
    type: 'website',
    title: 'Panth Duniya — World Cup 2026 Prediction',
    description: 'Predict matches. Earn points. Conquer the leaderboard.',
    siteName: 'Panth Duniya',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
