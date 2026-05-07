"use client";

import { useState } from "react";
import { PipelineStepper, DEFAULT_STEPS } from "@/components/PipelineStepper";
import { PipelineRunner } from "@/components/PipelineRunner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PipelinePage() {
  const [steps, setSteps] = useState(DEFAULT_STEPS.map(s => ({ ...s, status: "pending" as const })));

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
            <span className="text-[9px] uppercase tracking-widest text-indigo-400">
              Orchestrator
            </span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Review
          </Link>
        </div>

        {/* Pipeline stepper fills the rest */}
        <div className="flex-1">
          <PipelineStepper steps={steps} />
        </div>
      </header>

      {/* Main Runner */}
      <main className="flex-1 overflow-hidden">
        <PipelineRunner setSteps={setSteps} />
      </main>
    </div>
  );
}
