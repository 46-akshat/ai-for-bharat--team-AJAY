import { PipelineStepper } from "@/components/PipelineStepper";
import { ReviewDashboard } from "@/components/ReviewDashboard";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* Top bar: branding + pipeline stepper */}
      <header className="border-b border-zinc-800 bg-zinc-950 flex items-stretch">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 border-r border-zinc-800 flex-shrink-0">
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-tight text-zinc-100">
              KA-UBID
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600">
              Review Interface
            </span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600">
              Reviewer
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              reviewer_001
            </span>
          </div>
        </div>

        {/* Pipeline stepper fills the rest */}
        <div className="flex-1">
          <PipelineStepper />
        </div>
      </header>

      {/* Main dashboard */}
      <main className="flex-1 overflow-hidden">
        <ReviewDashboard />
      </main>
    </div>
  );
}
