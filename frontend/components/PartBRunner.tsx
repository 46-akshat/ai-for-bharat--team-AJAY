"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { runGenerateEvents, runClassifyStatuses } from "@/lib/api";

interface StepState {
    status: "idle" | "running" | "done" | "error";
    stdout: string;
}

export function PartBRunner({ onComplete }: { onComplete: () => void }) {
    const [genState, setGenState] = useState<StepState>({ status: "idle", stdout: "" });
    const [classState, setClassState] = useState<StepState>({ status: "idle", stdout: "" });

    async function runStep(
        fn: () => Promise<{ message: string; stdout: string }>,
        setState: React.Dispatch<React.SetStateAction<StepState>>,
        onDone?: () => void
    ) {
        setState({ status: "running", stdout: "" });
        try {
            const res = await fn();
            setState({ status: "done", stdout: res.stdout ?? res.message });
            onDone?.();
        } catch (e: unknown) {
            setState({ status: "error", stdout: e instanceof Error ? e.message : "Failed" });
        }
    }

    const bothDone = genState.status === "done" && classState.status === "done";

    return (
        <div className="border border-zinc-800 rounded-sm bg-zinc-900/40 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                <span className="text-[12px] font-semibold text-zinc-300">Part B Pipeline</span>
                <span className="text-[10px] text-zinc-600 ml-1">— generate events then classify statuses</span>
            </div>

            {/* Step 1: Generate Events */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <StepBadge status={genState.status} label="1" />
                    <span className="text-[12px] text-zinc-300 font-medium">Generate Events</span>
                    <span className="text-[10px] text-zinc-600">generate_events.py</span>
                    <button
                        onClick={() => runStep(runGenerateEvents, setGenState)}
                        disabled={genState.status === "running"}
                        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 text-[11px] rounded-sm hover:bg-indigo-900 transition-colors disabled:opacity-50"
                    >
                        <Play className="w-3 h-3" />
                        {genState.status === "running" ? "Running…" : "Run"}
                    </button>
                </div>
                {genState.stdout && (
                    <pre className="text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-sm p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {genState.stdout}
                    </pre>
                )}
            </div>

            {/* Step 2: Classify */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <StepBadge status={classState.status} label="2" />
                    <span className="text-[12px] text-zinc-300 font-medium">Classify Statuses</span>
                    <span className="text-[10px] text-zinc-600">query_engine.py</span>
                    <button
                        onClick={() => runStep(runClassifyStatuses, setClassState, onComplete)}
                        disabled={classState.status === "running" || genState.status !== "done"}
                        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 text-[11px] rounded-sm hover:bg-indigo-900 transition-colors disabled:opacity-50"
                    >
                        <Play className="w-3 h-3" />
                        {classState.status === "running" ? "Running…" : "Run"}
                    </button>
                </div>
                {classState.stdout && (
                    <pre className="text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-sm p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {classState.stdout}
                    </pre>
                )}
            </div>

            {bothDone && (
                <div className="flex items-center gap-2 text-emerald-400 text-[11px] pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Part B complete — dashboard refreshed with latest statuses.
                </div>
            )}
        </div>
    );
}

function StepBadge({ status, label }: { status: StepState["status"]; label: string }) {
    if (status === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    if (status === "error") return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    if (status === "running") return (
        <div className="w-4 h-4 border-2 border-indigo-700 border-t-indigo-300 rounded-full animate-spin flex-shrink-0" />
    );
    return (
        <span className="w-4 h-4 rounded-full border border-zinc-700 text-zinc-600 text-[10px] font-mono flex items-center justify-center flex-shrink-0">
            {label}
        </span>
    );
}
