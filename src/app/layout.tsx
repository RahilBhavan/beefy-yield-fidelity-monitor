import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL('https://yield.rahilbhavan.com'),
  title: {
    default: 'Yield/Fidelity — Beefy Vault Intelligence',
    template: '%s | Yield/Fidelity',
  },
  description: 'An independent monitor for friction-adjusted Beefy vault yield, on-chain price-per-share growth, and reproducible strategy drift on Base.',
  applicationName: 'Yield/Fidelity',
  authors: [{ name: 'Rahil Bhavan', url: 'https://github.com/RahilBhavan' }],
  creator: 'Rahil Bhavan',
  alternates: { canonical: '/' },
  keywords: ['DeFi', 'Beefy', 'Base', 'yield analytics', 'price per share', 'Next.js'],
  openGraph: {
    title: 'Yield/Fidelity — Beefy Vault Intelligence',
    description: 'Friction-adjusted yield estimates and reproducible on-chain strategy drift for active Beefy vaults on Base.',
    url: '/',
    siteName: 'Yield/Fidelity',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yield/Fidelity — Beefy Vault Intelligence',
    description: 'Friction-adjusted yield estimates and reproducible on-chain strategy drift for Beefy vaults on Base.',
  },
};

import Link from 'next/link';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#D6D6D6] text-[#1E1E1E] selection:bg-[#FE5238] selection:text-[#1E1E1E]">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div className="flex flex-col min-h-screen border-x-0 sm:border-x-[1px] border-[#1E1E1E] w-full max-w-[1600px] mx-auto bg-[#D6D6D6]">

          <header className="border-b-[1px] border-[#1E1E1E] bg-[#D6D6D6] z-50">
            <div className="w-full min-h-20 flex flex-col sm:flex-row sm:items-stretch">

              <div className="flex items-center px-6 md:px-10 py-4 sm:py-0 sm:border-r-[1px] border-[#1E1E1E] sm:flex-1">
                <Link href="/" className="flex min-h-11 items-center gap-3" aria-label="Yield/Fidelity home">
                  <div className="w-10 h-10 border-[1.5px] border-[#1E1E1E] flex items-center justify-center font-bold text-lg bg-[#FE5238] text-[#1E1E1E] rotate-3 hover:-rotate-3 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                      <path d="M10 4L2 12L10 20M14 4L22 12L14 20" />
                    </svg>
                  </div>
                  <span className="font-black text-xl md:text-2xl tracking-tighter uppercase">Yield<span className="text-[#A82A18]">/Fidelity</span></span>
                </Link>
              </div>

              <nav aria-label="Primary navigation" className="grid grid-cols-3 sm:flex border-t sm:border-t-0 border-[#1E1E1E]">
                <Link href="/#calculator" className="nav-link">Calculator</Link>
                <Link href="/dashboard" className="nav-link border-l border-[#1E1E1E]">Dashboard</Link>
                <Link href="/methodology" className="nav-link border-l border-[#1E1E1E]">Methodology</Link>
              </nav>

            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="flex-1 w-full bg-[#1E1E1E] text-[#D6D6D6] border-b-[1px] border-[#1E1E1E]">
            {children}
            <Analytics />
            <SpeedInsights />
          </main>

          <footer className="bg-[#D6D6D6] text-[#1E1E1E] py-10 px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-0 border-t border-[#1E1E1E]">
            <div className="md:border-r-[1px] border-[#1E1E1E] md:pr-10">
              <span className="font-black text-xl tracking-tighter uppercase mb-4 block">Yield<span className="text-[#A82A18]">/Fidelity</span></span>
              <p className="text-sm font-mono text-[#4A4A4A]">Reproducible DeFi yield intelligence.</p>
            </div>
            <div className="md:border-r-[1px] border-[#1E1E1E] md:px-10">
              <div className="font-mono text-xs uppercase font-bold mb-4">Systems</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-[#FE5238] transition-colors">Break-Even Calculator</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#FE5238] transition-colors">Yield Dashboard</Link></li>
                <li><Link href="/dashboard/strategies" className="hover:text-[#FE5238] transition-colors">Exceptions Requiring Review</Link></li>
              </ul>
            </div>
            <div className="md:border-r-[1px] border-[#1E1E1E] md:px-10">
              <div className="font-mono text-xs uppercase font-bold mb-4">Logs</div>
              <p className="font-mono text-[10px] opacity-70 leading-relaxed uppercase">
                MVP: BASE ONLY.<br />
                PPS: DAILY ON-CHAIN.<br />
                STATUS: SEE DASHBOARD.<br />
                VERSION: 0.1.0
              </p>
            </div>
            <div className="md:pl-10 flex flex-col justify-between">
              <div className="font-mono text-xs uppercase font-bold mb-4">Project</div>
              <a href="https://github.com/RahilBhavan/beefy-yield-fidelity-monitor" target="_blank" rel="noreferrer" className="font-sans text-sm font-medium underline hover:text-[#A82A18]">View source on GitHub</a>
              <p className="mt-3 font-mono text-[10px] uppercase opacity-70">Independent project. Not affiliated with Beefy.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
