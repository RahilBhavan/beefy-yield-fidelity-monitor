export default function DashboardLoading() {
  return (
    <div className="min-h-[640px] bg-[#D6D6D6] text-[#1E1E1E]" role="status" aria-label="Loading dashboard">
      <div className="px-6 md:px-10 py-10 border-b border-[#1E1E1E]">
        <div className="h-3 w-32 bg-[#FE5238] animate-pulse" />
        <div className="h-24 max-w-lg bg-[#1E1E1E]/15 mt-5 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 bg-[#1E1E1E] gap-px">
        <div className="xl:col-span-2 h-[420px] bg-[#2A2A2A] animate-pulse" />
        <div className="h-[420px] bg-[#EBEBEB] animate-pulse" />
      </div>
      <span className="sr-only">Loading yield analytics</span>
    </div>
  );
}
