import type { Metadata } from 'next';
import { Inter, Outfit, Noto_Sans_Malayalam, Anek_Malayalam } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AudioPlayer from '@/app/components/AudioPlayer';
import { Analytics } from '@vercel/analytics/next';
import FacebookPixel from '@/app/components/FacebookPixel';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const notoSansMalayalam = Noto_Sans_Malayalam({ subsets: ['malayalam'], weight: ['400', '500', '600', '700', '800'], variable: '--font-noto-malayalam' });
const anekMalayalam = Anek_Malayalam({ subsets: ['malayalam'], weight: ['300', '400', '500', '600', '700', '800'], variable: '--font-anek-malayalam' });

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
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${notoSansMalayalam.variable} ${anekMalayalam.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <FacebookPixel />
          <AudioPlayer />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
