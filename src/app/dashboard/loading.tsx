const pulse = 'animate-pulse bg-[#D9DBDA]';

export default function DashboardLoading() {
    return (
        <div className="min-h-[720px] bg-[#ECEDEB] text-[#202326]" role="status" aria-label="Loading portfolio yield dashboard">
            <div className="border-b border-[#BFC2C1] bg-[#F7F7F5] px-5 py-6 md:px-8">
                <div className={`h-5 w-36 rounded-full ${pulse}`} />
                <div className={`mt-4 h-12 w-full max-w-lg ${pulse}`} />
                <div className={`mt-3 h-5 w-full max-w-2xl ${pulse}`} />
            </div>
            <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 md:px-8 md:py-8">
                <div className="grid gap-4 xl:grid-cols-2">
                    {[0, 1].map((group) => (
                        <div key={group} className="grid grid-cols-3 gap-px border border-[#C6C8C8] bg-[#E0E1E1]">
                            {[0, 1, 2].map((metric) => <div key={metric} className={`h-28 bg-white ${pulse}`} />)}
                        </div>
                    ))}
                </div>
                <div className="grid gap-px border border-[#C6C8C8] bg-[#C6C8C8] lg:grid-cols-[1.55fr_1fr]">
                    <div className={`h-52 bg-white ${pulse}`} />
                    <div className={`h-52 bg-[#F2F3F1] ${pulse}`} />
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.75fr)]">
                    <div className={`h-[430px] border border-[#C6C8C8] bg-white ${pulse}`} />
                    <div className="space-y-5"><div className={`h-48 bg-white ${pulse}`} /><div className="h-56 animate-pulse bg-[#303336]" /></div>
                </div>
            </div>
            <span className="sr-only">Loading current portfolio, data quality, and performance analysis</span>
        </div>
    );
}
