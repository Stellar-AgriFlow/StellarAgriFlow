import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WalletProvider } from '../context/WalletContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'AgriFlow | Global Agricultural Payments Powered by Stellar',
  description:
    'AgriFlow is building financial infrastructure for global agriculture, connecting farmers, buyers and agricultural businesses through fast, transparent Stellar payments.',
  keywords: [
    'Stellar',
    'Freighter',
    'XLM',
    'Agriculture',
    'AgriTech',
    'Cross-border payments',
    'Testnet',
  ],
  authors: [{ name: 'AgriFlow Protocol' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><circle cx='12' cy='12' r='10'/></svg>" />
      </head>
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
