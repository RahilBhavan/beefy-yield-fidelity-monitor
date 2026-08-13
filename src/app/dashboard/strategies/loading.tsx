const pulse = 'animate-pulse bg-[#1E1E1E]/8';

export default function StrategiesLoading() {
    return (
        <div className="min-h-[720px] bg-[#D6D6D6] text-[#1E1E1E]" role="status" aria-label="Loading exception review">
            <div className="border-b border-[#1E1E1E] px-6 py-8 md:px-10">
                <div className={`h-5 w-44 ${pulse}`} />
                <div className={`mt-4 h-12 w-full max-w-lg ${pulse}`} />
                <div className={`mt-3 h-5 w-full max-w-2xl ${pulse}`} />
            </div>
            <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
                <div className="border border-[#1E1E1E]/20">
                    <div className={`h-28 border-b border-[#1E1E1E]/15 ${pulse}`} />
                    {[0, 1, 2, 3].map((row) => <div key={row} className={`h-16 border-b border-[#1E1E1E]/10 ${pulse}`} />)}
                </div>
            </div>
            <span className="sr-only">Loading vault performance exceptions</span>
        </div>
    );
}
