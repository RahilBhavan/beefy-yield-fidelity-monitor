"use client";

import { ScanEye } from 'lucide-react';

const MOCK_DATA = [
    { day: '01', target: 12.0, actual: 12.0 },
    { day: '05', target: 12.0, actual: 11.8 },
    { day: '10', target: 12.0, actual: 11.2 },
    { day: '15', target: 12.0, actual: 10.5 },
    { day: '20', target: 12.0, actual: 10.1 },
    { day: '25', target: 12.0, actual: 9.4 },
    { day: '30', target: 12.0, actual: 8.8 },
];

export function DriftChart() {
    const currentTarget = MOCK_DATA[MOCK_DATA.length - 1].target;
    const currentActual = MOCK_DATA[MOCK_DATA.length - 1].actual;
    const driftPerc = ((currentTarget - currentActual) / currentTarget) * 100;

    return (
        <div className="w-full flex flex-col h-full text-[#D6D6D6]" role="region" aria-label="Strategy Drift Chart">
            {/* Screen reader only data representation */}
            <div className="sr-only">
                <h3>Strategy Drift Data</h3>
                <table>
                    <thead>
                        <tr><th>Day</th><th>Target Yield</th><th>Actual Yield</th></tr>
                    </thead>
                    <tbody>
                        {MOCK_DATA.map((point) => (
                            <tr key={point.day}>
                                <td>{point.day}</td>
                                <td>{point.target}%</td>
                                <td>{point.actual}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-10 gap-4" aria-hidden="true">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <ScanEye className="w-6 h-6 text-[#FE5238]" />
                        Strategy Drift Vector
                    </h2>
                    <p className="font-mono text-[10px] uppercase font-bold text-[#D6D6D6]/60 mt-1">30-Day Trajectory: Projected vs Net Yield.</p>
                </div>

                <div className="border-[1.5px] border-[#FE5238] p-3 max-w-[200px] border-dashed">
                    <div className="font-mono text-[10px] uppercase font-bold text-[#FE5238] mb-1">Delta / Drift</div>
                    <div className="text-3xl font-black text-[#FE5238] tracking-tighter">
                        {driftPerc.toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="relative flex-1 min-h-[300px] w-full mt-4 flex items-end justify-between gap-2 border-b-[1.5px] border-[#D6D6D6]/30 pb-4" aria-hidden="true">
                {/* Y-Axis scale markers */}
                <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between font-mono text-[10px] font-bold text-[#D6D6D6]/40 pointer-events-none z-0">
                    <div className="border-t-[1px] border-dashed border-[#D6D6D6]/20 w-full pt-1">15% MAX</div>
                    <div className="border-t-[1px] border-dashed border-[#D6D6D6]/20 w-full pt-1">10%</div>
                    <div className="border-t-[1px] border-dashed border-[#D6D6D6]/20 w-full pt-1">5%</div>
                    <div>0%</div>
                </div>

                {MOCK_DATA.map((point) => (
                    <div key={point.day} className="relative z-10 flex flex-col items-center justify-end h-full w-full group">
                        {/* Tooltip on Hover */}
                        <div className="absolute top-0 opacity-0 group-hover:opacity-100 bg-[#EBEBEB] text-[#1E1E1E] font-mono text-[10px] font-bold uppercase p-2 border-[1.5px] border-[#1E1E1E] whitespace-nowrap z-20 pointer-events-none -translate-y-full">
                            TAR: {point.target}%<br />
                            NET: {point.actual}%
                        </div>

                        {/* Target Bar (Background, Outline) */}
                        <div className="relative w-full max-w-[40px] h-[300px] flex items-end">
                            <div
                                style={{ height: `${(point.target / 15) * 100}%` }}
                                className="absolute bottom-0 w-full border-[1.5px] border-[#D6D6D6]/50 bg-[#1E1E1E] transition-all"
                            ></div>

                            {/* Actual Yield Bar (Solid Fill) */}
                            <div
                                style={{ height: `${(point.actual / 15) * 100}%` }}
                                className="absolute bottom-0 w-full bg-[#D6D6D6] hover:bg-[#FE5238] transition-colors"
                            ></div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#D6D6D6]/60 mt-4 px-1 bg-[#1E1E1E]">D.{point.day}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-8 mt-8 border-[1.5px] border-[#D6D6D6]/30 p-4 w-fit" aria-hidden="true">
                <div className="font-mono text-[10px] uppercase font-bold flex items-center gap-2">
                    <div className="w-3 h-3 border-[1.5px] border-[#D6D6D6]/50 bg-transparent"></div>
                    Platform Target
                </div>
                <div className="font-mono text-[10px] uppercase font-bold flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#D6D6D6] border-[1.5px] border-[#D6D6D6]"></div>
                    Actual Growth (PPS)
                </div>
            </div>
        </div>
    );
}
