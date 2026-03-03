import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900']
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '700']
});

export const metadata: Metadata = {
  title: 'Beefy Op/Intelligence',
  description: 'Operational Intelligence for Yield-Fidelity',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} antialiased min-h-screen bg-[#D6D6D6] text-[#1E1E1E] selection:bg-[#FE5238] selection:text-[#1E1E1E]`}>
        <div className="flex flex-col min-h-screen border-x-0 sm:border-x-[1px] border-[#1E1E1E] w-full max-w-[1600px] mx-auto bg-[#D6D6D6]">

          {/* Brutalist Hard-Border Header */}
          <header className="border-b-[1px] border-[#1E1E1E] bg-[#D6D6D6] z-50">
            <div className="w-full h-20 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_200px]">

              <div className="flex items-center px-6 md:px-10 border-r-[1px] border-transparent md:border-[#1E1E1E]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-[1.5px] border-[#1E1E1E] flex items-center justify-center font-bold text-lg bg-[#FE5238] text-[#1E1E1E] rotate-3 hover:-rotate-3 transition-transform">
                    {/* Abstract angular shift icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M10 4L2 12L10 20M14 4L22 12L14 20" />
                    </svg>
                  </div>
                  <span className="font-black text-2xl tracking-tighter uppercase">Beefy<span className="text-[#FE5238]">.fi</span></span>
                </div>
              </div>

              <nav className="flex items-center justify-end md:justify-center px-6 md:px-0">
                <a href="/dashboard" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-[#FE5238] flex items-center gap-2">
                  <span className="w-6 h-[1.5px] bg-current inline-block"></span>
                  Menu
                </a>
              </nav>

            </div>
          </header>

          <main className="flex-1 w-full bg-[#1E1E1E] text-[#D6D6D6] border-b-[1px] border-[#1E1E1E]">
            {children}
          </main>

          <footer className="bg-[#D6D6D6] text-[#1E1E1E] py-10 px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-0 border-t border-[#1E1E1E]">
            <div className="md:border-r-[1px] border-[#1E1E1E] md:pr-10">
              <span className="font-black text-xl tracking-tighter uppercase mb-4 block">Beefy<span className="text-[#FE5238]">.fi</span></span>
              <p className="text-sm font-mono opacity-60">Operative yield intelligence.</p>
            </div>
            <div className="md:border-r-[1px] border-[#1E1E1E] md:px-10">
              <div className="font-mono text-xs uppercase font-bold mb-4">Systems</div>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="hover:text-[#FE5238] transition-colors">Break-Even Calculator</a></li>
                <li><a href="/dashboard" className="hover:text-[#FE5238] transition-colors">Yield Dashboard</a></li>
                <li><a href="/dashboard/strategies" className="hover:text-[#FE5238] transition-colors">Flagged Strategies</a></li>
              </ul>
            </div>
            <div className="md:border-r-[1px] border-[#1E1E1E] md:px-10">
              <div className="font-mono text-xs uppercase font-bold mb-4">Logs</div>
              <p className="font-mono text-[10px] opacity-70 leading-relaxed uppercase">
                SYSTEM NOMINAL. <br />
                DB: CONNECTED.<br />
                DRIFT: MONITORING.<br />
                VERSION: 1.0.0
              </p>
            </div>
            <div className="md:pl-10 flex flex-col justify-between">
              <div className="font-mono text-xs uppercase font-bold mb-4">Location</div>
              <p className="font-sans text-sm font-medium">Bhavan / Univ of Michigan</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
