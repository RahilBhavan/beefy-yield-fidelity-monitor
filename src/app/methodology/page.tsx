import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Methodology',
    description: 'Data sources, formulas, assumptions, and limitations.',
};

const sections = [
    {
        title: 'Realized yield',
        body: 'The monitor reads getPricePerFullShare from each tracked Beefy vault at one recorded Base block. Consecutive PPS ratios are accumulated as logarithmic returns, preserving compounding across the measurement window.',
    },
    {
        title: 'Expected yield',
        body: 'Each PPS observation stores the Beefy-reported target APY observed during the same scrape. Expected growth is compounded interval by interval, so later APY changes are not applied retroactively.',
    },
    {
        title: 'Drift',
        body: 'Relative drift is (realized cumulative return − expected cumulative return) ÷ expected cumulative return. A vault is not analyzed until it has at least three valid observations spanning seven days. Confidence rises with longer windows and more observations.',
    },
    {
        title: 'Portfolio decision metrics',
        body: 'Portfolio expected and realized APY are weighted by the TVL of vaults that pass the evidence gate. The annualized yield gap is the signed sum of TVL × (expected APY − realized APY). It is an extrapolated comparison, not a forecast or guaranteed dollar loss.',
    },
    {
        title: 'Break-even estimate',
        body: 'Break-even divides estimated entry and exit network costs by the effective daily yield implied by Beefy-reported APY. Sensitivity scenarios vary APY and fees around the current estimate. The default uses representative transaction sizes and Base L1 fee upper bounds; it is not a wallet-specific transaction quote.',
    },
    {
        title: 'Limitations',
        body: 'This measures vault share growth and execution friction. It does not predict token prices, impermanent loss, slippage, bridge costs, tax treatment, protocol exploits, or future APY. Results are informational and are not financial advice.',
    },
];

export default function MethodologyPage() {
    return (
        <div className="bg-[#D6D6D6] text-[#1E1E1E] min-h-full">
            <header className="px-6 md:px-10 py-10 border-b border-[#1E1E1E]">
                <p className="font-mono text-xs uppercase font-bold text-[#A82A18]">Transparent by construction</p>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mt-2">Methodology</h1>
                <p className="mt-5 max-w-2xl font-mono text-sm leading-relaxed">Every displayed result should be reproducible from exported observations, recorded block provenance, and the formulas below.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2">
                {sections.map((section, index) => (
                    <section
                        key={section.title}
                        className="group p-8 md:p-10 border-b border-[#1E1E1E] last:border-b-0 md:[&:nth-child(odd)]:border-r md:[&:nth-last-child(-n+2)]:border-b-0 hover:bg-[#1E1E1E] hover:text-[#D6D6D6] transition-colors"
                    >
                        <div className="font-mono text-xs font-bold text-[#A82A18] group-hover:text-[#FE5238]">{String(index + 1).padStart(2, '0')}</div>
                        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">{section.title}</h2>
                        <p className="font-mono text-sm leading-relaxed mt-4 opacity-75">{section.body}</p>
                    </section>
                ))}
            </div>
            <div className="p-8 md:px-10 md:py-8 flex flex-wrap gap-4 border-t border-[#1E1E1E]">
                <Link href="/dashboard" className="inline-flex h-11 min-w-[44px] items-center rounded-full border-[1.5px] border-[#1E1E1E] px-5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#1E1E1E] hover:text-[#FE5238] transition-colors">Return to dashboard</Link>
                <a href="/api/export" className="inline-flex h-11 min-w-[44px] items-center rounded-full border-[1.5px] border-[#1E1E1E] bg-[#1E1E1E] px-5 font-mono text-xs font-bold uppercase tracking-widest text-[#FE5238] hover:bg-transparent hover:text-[#1E1E1E] transition-colors">Download observations</a>
            </div>
        </div>
    );
}
