import { Calculator } from '@/components/Calculator';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full space-y-20 pb-20">

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-16 text-center space-y-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Base Network Analysis
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl">
          Don't Let Gas Fees <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            Eat Your Yield.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mt-4">
          Real-time transparency into Net Realized APY. Calculate exactly how many days it takes for your deposit to break even against L2 gas and performance fees.
        </p>

        <div className="flex items-center gap-4 mt-8">
          <a href="#calculator" className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
            Calculate Break-Even <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#features" className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-medium transition-all">
            How it works
          </a>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-16 text-left">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
            <Zap className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-white font-semibold text-lg">Real-Time Gas Fares</h3>
            <p className="text-zinc-400 mt-2 text-sm">Pulls exact gwei from the Base network to estimate your entry and exit costs.</p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-white font-semibold text-lg">Drift Analysis</h3>
            <p className="text-zinc-400 mt-2 text-sm">Compares projected APY against actual Price-Per-Share (PPS) growth.</p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4 text-black font-bold">B</div>
            <h3 className="text-white font-semibold text-lg">Beefy Ecosystem</h3>
            <p className="text-zinc-400 mt-2 text-sm">Directly integrates with the Beefy API to monitor vault performance over time.</p>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="w-full max-w-5xl pt-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Break-Even Calculator</h2>
          <p className="text-zinc-400">Enter your deposit amount and select a vault to see your true yield timeline.</p>
        </div>

        <Calculator />
      </section>
    </div>
  );
}
