import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { APP_CONFIG } from '@/config/contracts';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-dark-50 text-dark-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
