import { Calculator } from '@/components/Calculator';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">

      {/* Brutalist Hero Block */}
      <section className="w-full flex flex-col pt-16 pb-12 px-6 md:px-10 border-b-[1px] border-[#1E1E1E] bg-[#FE5238]">
        <div className="flex justify-between items-start w-full">
          <h1 className="text-[120px] md:text-[200px] font-black tracking-tighter leading-[0.85] text-[#1E1E1E]">
            Yield/ <br />
            <span className="inline-block relative">
              Fidelity
              {/* Abstract geometric element */}
              <div className="absolute -top-4 -right-20 w-16 h-4 bg-[#1E1E1E] -rotate-45 hidden md:block"></div>
            </span>
          </h1>

          <div className="hidden lg:block w-[300px] text-lg font-medium tracking-tight mt-10">
            Operational Intelligence for Every Vault, Every Chain, Every Depositor.
          </div>
        </div>

        <div className="max-w-3xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t-[1px] border-[#1E1E1E] pt-8">
          <p className="font-mono text-sm leading-relaxed font-bold uppercase tracking-wider">
            Analyze on-chain Gas fees and platform Performance fees to flag negative returns in near real-time.
          </p>
          <a href="#calculator" className="w-fit h-fit px-8 py-4 border-[1.5px] border-[#1E1E1E] rounded-full font-mono text-sm font-bold uppercase tracking-widest hover:bg-[#1E1E1E] hover:text-[#FE5238] transition-colors flex items-center gap-2 group">
            Initialize Calc <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Grid Features */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 bg-[#EBEBEB]">
        <div className="p-8 border-b-[1px] md:border-b-0 md:border-r-[1px] border-[#1E1E1E] group hover:bg-[#1E1E1E] hover:text-[#D6D6D6] transition-colors">
          <div className="w-12 h-12 border-[1.5px] border-current rounded-full mb-8 flex items-center justify-center" aria-hidden="true">01</div>
          <h2 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-[#FE5238]">Real-Time Gas Fares</h2>
          <p className="font-mono text-xs uppercase leading-relaxed font-bold opacity-80">
            Pulls exact gwei from the Base network to mathematically estimate your entry and exit costs.
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

      {/* Calculator Section */}
      <section id="calculator" className="w-full border-t-[1px] border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Left info column */}
          <div className="border-b-[1px] lg:border-b-0 lg:border-r-[1px] border-[#D6D6D6]/30 p-8 md:p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="font-mono text-xs text-[#FE5238] uppercase font-bold tracking-widest mb-4">{"/// Simulation Module"}</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">Break-Even<br />Analyzer</h2>
              <p className="font-mono text-sm leading-relaxed opacity-70">
                Enter your deposit loadout and assign a target Vault strategy. System will extrapolate chronological yield against gas friction to identify your breakeven threshold.
              </p>
            </div>

            {/* Tech Data Block abstract UI */}
            <div className="font-mono text-[10px] text-[#D6D6D6]/40 hidden lg:grid grid-cols-2 gap-x-4 gap-y-1 mt-12">
              <div>SYS.VOL</div><div>01001100</div>
              <div>LATENCY.MS</div><div>14ms <span className="text-green-500">OK</span></div>
              <div>L2.FETCH</div><div>base-rpc</div>
              <div>RATE.LM</div><div>0x81FA</div>
            </div>
          </div>

          {/* Right component column */}
          <div className="lg:col-span-2 p-6 md:p-12">
            <Calculator />
          </div>
        </div>
      </section>
    </div>
  );
}
