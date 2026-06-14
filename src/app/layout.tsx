import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AudioPlayer from '@/app/components/AudioPlayer';

export const metadata: Metadata = {
  title: {
    default: 'പന്ത്ദുനിയ | Panthduniya — World Cup 2026 Prediction',
    template: '%s | പന്ത്ദുനിയ',
  },
  description:
    'Predict the FIFA World Cup 2026 winner, finalists, semi-finalists, Golden Boot & Glove winners. 6 questions, 100 points, zero fee. Built for football fans.',
  keywords: ['FIFA World Cup 2026', 'football prediction', 'Panthduniya', 'പന്ത്ദുനിയ', 'leaderboard', 'prediction game'],
  openGraph: {
    type: 'website',
    title: 'പന്ത്ദുനിയ — World Cup 2026 Prediction Hub',
    description: '6 questions. 100 points. Predict & conquer the leaderboard.',
    siteName: 'പന്ത്ദുനിയ',
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
        <link href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <AudioPlayer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
