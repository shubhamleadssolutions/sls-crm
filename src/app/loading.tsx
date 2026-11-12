import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-44 h-16">
          <Image
            src="/sls-logo-full.png"
            alt="Shubham Leads Solutions"
            fill
            className="object-contain animate-pulse"
            priority
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Loading Workspace...
        </p>
      </div>
    </div>
  );
}
