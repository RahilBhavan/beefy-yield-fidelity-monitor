import { Calculator } from '@/components/Calculator';
import { ArrowRight, Blocks, Database, Gauge, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const proofPoints = [
  { value: '8453', label: 'Base chain ID' },
  { value: 'Daily', label: 'On-chain PPS capture' },
  { value: '7 days', label: 'Minimum drift window' },
  { value: 'CSV', label: 'Reproducible export' },
];

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">

      <section className="w-full flex flex-col pt-14 md:pt-16 pb-12 px-6 md:px-10 border-b-[1px] border-[#1E1E1E] bg-[#FE5238] overflow-hidden">
        <div className="flex justify-between items-start w-full gap-8">
          <h1 className="text-[clamp(4rem,16vw,12.5rem)] font-black tracking-tighter leading-[0.82] text-[#1E1E1E]">
            Yield/ <br />
            <span className="inline-block relative">
              Fidelity
              <div className="absolute -top-4 -right-20 w-16 h-4 bg-[#1E1E1E] -rotate-45 hidden md:block"></div>
            </span>
          </h1>

          <div className="hidden lg:block w-[300px] text-lg font-medium tracking-tight mt-10">
            Reproducible Yield Intelligence for Active Beefy Vaults on Base.
          </div>
        </div>

        <div className="max-w-3xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t-[1px] border-[#1E1E1E] pt-8">
          <p className="font-mono text-sm leading-relaxed font-bold uppercase tracking-wider">
            Analyze current Base execution costs and Beefy-reported yield to estimate when a deposit can overcome network friction.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#calculator" className="w-fit h-fit px-6 md:px-8 py-4 border-[1.5px] border-[#1E1E1E] rounded-full font-mono text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#1E1E1E] hover:text-[#FE5238] transition-colors flex items-center gap-2 group">
              Run estimate <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link href="/dashboard" className="w-fit h-fit px-6 md:px-8 py-4 border-[1.5px] border-[#1E1E1E] rounded-full font-mono text-xs md:text-sm font-bold uppercase tracking-widest bg-[#1E1E1E] text-[#FE5238] hover:bg-transparent hover:text-[#1E1E1E] transition-colors">
              View monitor
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Project facts" className="grid grid-cols-2 lg:grid-cols-4 bg-[#1E1E1E] text-[#D6D6D6] border-b border-[#1E1E1E]">
        {proofPoints.map((point) => (
          <div key={point.label} className="p-5 md:p-7 border-r border-b lg:border-b-0 border-[#D6D6D6]/25 last:border-r-0">
            <div className="text-2xl md:text-3xl font-black tracking-tighter text-[#FE5238]">{point.value}</div>
            <div className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-60 mt-1">{point.label}</div>
          </div>
        ))}
      </section>

      <section id="calculator" className="w-full border-t-[1px] border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="border-b-[1px] lg:border-b-0 lg:border-r-[1px] border-[#D6D6D6]/30 p-8 md:p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="font-mono text-xs text-[#FE5238] uppercase font-bold tracking-widest mb-4">Live planning tool</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">Break-Even<br />Analyzer</h2>
              <p className="font-mono text-sm leading-relaxed text-[#D6D6D6]/75">
                Enter a deposit amount and choose a vault. The model compares effective daily yield with estimated entry and exit costs to calculate a break-even horizon.
              </p>
            </div>

            <dl className="font-mono text-xs text-[#D6D6D6]/70 hidden lg:grid grid-cols-2 gap-x-4 gap-y-1 mt-12">
              <dt>CHAIN.ID</dt><dd>8453</dd>
              <dt>DRIFT.WINDOW</dt><dd>&gt;= 7 DAYS</dd>
              <dt>OBSERVATIONS</dt><dd>&gt;= 3 VALID</dd>
              <dt>FRESHNESS.SLO</dt><dd>&lt; 36 HOURS</dd>
            </dl>
          </div>

          <div className="lg:col-span-2 p-6 md:p-12">
            <Calculator />
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 bg-[#EBEBEB]">
        <div className="p-8 border-b-[1px] md:border-b-0 md:border-r-[1px] border-[#1E1E1E] group hover:bg-[#1E1E1E] hover:text-[#D6D6D6] transition-colors">
          <div className="w-12 h-12 border-[1.5px] border-current rounded-full mb-8 flex items-center justify-center" aria-hidden="true">01</div>
          <h2 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-[#FE5238]">Real-Time Gas Fares</h2>
          <p className="font-mono text-xs uppercase leading-relaxed font-bold opacity-80">
            Combines current Base execution fees, L1 fee upper bounds, and explicit transaction-size assumptions.
          </p>
        </div>
        <div className="p-8 border-b-[1px] md:border-b-0 md:border-r-[1px] border-[#1E1E1E] group hover:bg-[#1E1E1E] hover:text-[#D6D6D6] transition-colors">
          <div className="w-12 h-12 border-[1.5px] border-current rounded-full mb-8 flex items-center justify-center" aria-hidden="true">02</div>
          <h2 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-[#FE5238]">Drift Analysis</h2>
          <p className="font-mono text-xs uppercase leading-relaxed font-bold opacity-80">
            Compares projected APY against verified Price-Per-Share (PPS) chronological growth points.
          </p>
        </div>
        <div className="p-8 group bg-[#D6D6D6] hover:bg-[#1E1E1E] hover:text-[#D6D6D6] transition-colors">
          <div className="w-12 h-12 border-[1.5px] border-current rounded-full mb-8 flex items-center justify-center bg-[#FE5238] text-[#1E1E1E]" aria-hidden="true">B</div>
          <h2 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-[#FE5238]">Beefy Ecosystem</h2>
          <p className="font-mono text-xs uppercase leading-relaxed font-bold opacity-80">
            Directly integrates with the live API to dynamically monitor vault performance over intervals.
          </p>
        </div>
      </section>

      <section className="bg-[#D6D6D6] text-[#1E1E1E] border-t border-[#1E1E1E]">
        <div className="px-6 md:px-10 py-10 border-b border-[#1E1E1E] flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase font-bold text-[#A82A18]">Evidence, not estimates alone</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mt-2">From contract to decision.</h2>
          </div>
          <p className="max-w-xl font-mono text-xs uppercase leading-relaxed font-bold opacity-75">Every drift result traces back to a block, contract, provider, raw price-per-share value, and the APY observed at that moment.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {[
            { icon: Blocks, step: '01', title: 'Read', body: 'Capture vault PPS at a recorded Base block.' },
            { icon: Database, step: '02', title: 'Persist', body: 'Store raw values, APY, TVL, and scrape provenance.' },
            { icon: ShieldCheck, step: '03', title: 'Validate', body: 'Reject invalid points and require a seven-day baseline.' },
            { icon: Gauge, step: '04', title: 'Compare', body: 'Measure realized growth against interval-matched yield.' },
          ].map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="p-7 md:p-8 border-b md:border-b-0 md:border-r last:border-r-0 border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-8"><span className="font-mono text-xs font-bold">{step}</span><Icon className="w-5 h-5 text-[#A82A18]" aria-hidden="true" /></div>
              <h3 className="text-xl font-black uppercase">{title}</h3>
              <p className="font-mono text-xs uppercase leading-relaxed font-bold opacity-75 mt-3">{body}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
