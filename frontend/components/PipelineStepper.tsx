"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/lib/types";

export const DEFAULT_STEPS: PipelineStep[] = [
  {
    id: 1,
    label: "Generator",
    sublabel: "Synthetic data",
    status: "done",
  },
  {
    id: 2,
    label: "Normalize",
    sublabel: "Text cleaning",
    status: "done",
  },
  {
    id: 3,
    label: "Blocking",
    sublabel: "C++ Trie / PAN·GST",
    status: "done",
  },
  {
    id: 4,
    label: "Scoring",
    sublabel: "Splink EM",
    status: "done",
  },
  {
    id: 5,
    label: "Decision",
    sublabel: "Human Review",
    status: "active",
  },
];

interface PipelineStepperProps {
  steps?: PipelineStep[];
}

export function PipelineStepper({ steps = DEFAULT_STEPS }: PipelineStepperProps) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            {/* Step node */}
            <div className="flex items-center gap-1.5 px-3 py-1">
              <StepIcon status={step.status} />
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider leading-none",
                    step.status === "done" && "text-zinc-400",
                    step.status === "active" && "text-emerald-400",
                    step.status === "pending" && "text-zinc-600"
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none mt-0.5",
                    step.status === "done" && "text-zinc-600",
                    step.status === "active" && "text-emerald-700",
                    step.status === "pending" && "text-zinc-700"
                  )}
                >
                  {step.sublabel}
                </span>
              </div>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 flex-shrink-0",
                  idx < 3 ? "bg-zinc-600" : "bg-zinc-800",
                  step.status === "done" && steps[idx + 1]?.status !== "pending" && "bg-emerald-600/50"
                )}
              />
            )}
          </div>
        ))}

        {/* Right side: pipeline metadata */}
        <div className="ml-auto flex items-center gap-4 text-[11px] text-zinc-500 border-l border-zinc-800 pl-4">
          <span>
            <span className="text-zinc-400 font-mono">3</span> pending
          </span>
          <span>
            <span className="text-zinc-400 font-mono">0</span> resolved
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ status }: { status: PipelineStep["status"] }) {
  if (status === "done")
    return <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
  if (status === "active")
    return (
      <Loader2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 animate-spin" />
    );
  return <Circle className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />;
}
