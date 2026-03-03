import type { Metadata } from 'next';
import { Outfit, Geist_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Beefy Yield-Fidelity Monitor',
  description: 'Real-time transparency into Net Realized APY and break-even gas analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${geistMono.variable} antialiased min-h-screen bg-black text-white selection:bg-green-500/30 selection:text-green-200`}>
        {/* Subtle Background Glow */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black"></div>
        <div className="flex flex-col min-h-screen">
          <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-black font-bold text-sm">BFY</span>
                </div>
                <span className="font-semibold text-xl tracking-tight text-zinc-100">Yield Fidelity</span>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Dashboard</a>
                <a href="/" className="text-sm font-medium text-green-400 flex items-center gap-1 group">
                  Break-Even Calculator
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {children}
          </main>

          <footer className="border-t border-white/5 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2">
              <p className="text-zinc-500 text-sm">Developed by Rahil Bhavan</p>
              <p className="text-zinc-600 text-xs">Beefy Yield-Fidelity Monitor</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
