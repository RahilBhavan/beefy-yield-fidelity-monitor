const pulse = 'animate-pulse bg-[#1E1E1E]/8';
const pulseDark = 'animate-pulse bg-[#D6D6D6]/10';

export default function DashboardLoading() {
    return (
        <div className="min-h-[720px] bg-[#D6D6D6] text-[#1E1E1E]" role="status" aria-label="Loading portfolio yield dashboard">
            <div className="border-b border-[#1E1E1E] px-6 py-8 md:px-10">
                <div className={`h-6 w-36 border-[1.5px] border-[#1E1E1E]/20 ${pulse}`} />
                <div className={`mt-4 h-14 w-full max-w-lg ${pulse}`} />
                <div className={`mt-3 h-5 w-full max-w-2xl ${pulse}`} />
            </div>
            <div className="border-b border-[#1E1E1E] bg-[#1E1E1E] px-6 py-10 md:px-10">
                <div className={`h-10 w-2/3 max-w-xl ${pulseDark}`} />
                <div className={`mt-4 h-24 w-40 ${pulseDark}`} />
            </div>
            <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 md:px-8 md:py-8">
                <div className={`h-[380px] border border-[#1E1E1E]/20 ${pulse}`} />
            </div>
            <span className="sr-only">Loading current portfolio, data quality, and performance analysis</span>
        </div>
    );
}
