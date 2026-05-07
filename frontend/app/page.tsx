import { PipelineStepper } from "@/components/PipelineStepper";
import { ReviewDashboard } from "@/components/ReviewDashboard";
import Link from "next/link";
import { Layers, Brain } from "lucide-react";

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
          <Link
            href="/pipeline"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 hover:text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Run Pipeline
          </Link>
          <Link
            href="/intelligence"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-900 transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            Intelligence
          </Link>
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
