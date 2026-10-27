import { Calculator } from '@/components/Calculator';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full bg-[#EBEBEB] text-[#1E1E1E]">
      <section className="decision-intro">
        <div>
          <p className="eyebrow">Beefy vaults / Base network</p>
          <h1>Make yield<br />worth the fees.</h1>
        </div>
        <div className="decision-intro-copy">
          <p>Before you deposit, see how long estimated earnings could take to cover your entry and exit costs.</p>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
            Review observed yield <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section id="calculator" aria-labelledby="calculator-title" className="calculator-section">
        <div className="calculator-heading">
          <div>
            <p className="eyebrow text-[#FF765F]">01 / Plan a deposit</p>
            <h2 id="calculator-title">Break-Even Analyzer</h2>
          </div>
          <p>Set your deposit. Choose a vault.<br />Compare the rate behind the estimate.</p>
        </div>
        <Calculator />
        <p className="calculator-note">A planning estimate, not a guaranteed return. Token price changes, impermanent loss and swap costs can change your outcome.</p>
      </section>

      <section className="evidence-section" aria-labelledby="evidence-title">
        <div>
          <p className="eyebrow">02 / Check the evidence</p>
          <h2 id="evidence-title">Reported yield.<br />Observed growth.<br />Know the difference.</h2>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4 mt-5">
            Open the yield monitor <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="evidence-rows">
          <div><span className="eyebrow">Current rates</span><p>Headline APY comes from Beefy. Fee estimates include Base execution and L1 costs, with explicit transaction assumptions.</p></div>
          <div><span className="eyebrow">Measured history</span><p>Historical comparisons require at least three valid price-per-share observations spanning seven days. Missing evidence stays unavailable.</p></div>
          <div><span className="eyebrow">Traceable results</span><p>Daily observations retain block, contract and provider provenance. Review the <Link href="/methodology" className="underline underline-offset-4">comparison methodology</Link> before interpreting a result.</p></div>
        </div>
      </section>
    </div>
  );
}
