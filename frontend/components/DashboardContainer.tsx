"use client";

import { useState } from "react";
import { PipelineStepper } from "@/components/PipelineStepper";
import { ReviewDashboard } from "@/components/ReviewDashboard";
import { IntelligenceDashboard } from "@/components/IntelligenceDashboard";
import Link from "next/link";
import { Layers, Activity, Inbox } from "lucide-react";

export function DashboardContainer() {
  const [activeTab, setActiveTab] = useState<"review" | "intelligence">("review");

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
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 border-r border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === "review" 
                ? "bg-zinc-800 text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Review Queue
          </button>
          <button
            onClick={() => setActiveTab("intelligence")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === "intelligence" 
                ? "bg-sky-900/40 text-sky-400 border border-sky-800/50" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Intelligence Engine
          </button>
        </div>

        {/* Pipeline stepper fills the rest */}
        <div className="flex-1 min-w-0 border-l border-zinc-800 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <PipelineStepper />
        </div>
      </header>

      {/* Main dashboard */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "review" ? <ReviewDashboard /> : <IntelligenceDashboard />}
      </main>
    </div>
  );
}
