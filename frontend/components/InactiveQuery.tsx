"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { InactiveResult, UBIDStatus } from "@/lib/types";
import { Search, AlertTriangle, Moon, XCircle } from "lucide-react";

interface InactiveQueryProps {
    onSelectUbid: (ubid: string) => void;
}

const STATUS_META = {
    active: { color: "text-emerald-400", dot: "bg-emerald-400" },
    dormant: { color: "text-yellow-400", dot: "bg-yellow-400" },
    closed: { color: "text-red-400", dot: "bg-red-500" },
} as const;

const PRESETS = [
    { label: "6 months", days: 180 },
    { label: "12 months", days: 365 },
    { label: "18 months", days: 548 },
    { label: "24 months", days: 730 },
];

export function InactiveQuery({ onSelectUbid }: InactiveQueryProps) {
    const [days, setDays] = useState(180);
    const [result, setResult] = useState<InactiveResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function runQuery() {
        setIsLoading(true);
        setError(null);
        try {
            const { fetchInactiveBusinesses } = await import("@/lib/api");
            const data = await fetchInactiveBusinesses(days);
            setResult(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Query failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Query builder */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-[12px] font-semibold text-zinc-300">Compliance Query</span>
                    <span className="text-[10px] text-zinc-600 ml-1">— businesses with no activity in the last N days</span>
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-1">Preset</span>
                    {PRESETS.map(p => (
                        <button
                            key={p.days}
                            onClick={() => setDays(p.days)}
                            className={cn(
                                "text-[11px] px-2 py-1 border rounded-sm transition-colors",
                                days === p.days
                                    ? "bg-orange-950 border-orange-700 text-orange-300"
                                    : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Custom input + run */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Custom:</span>
                    <input
                        type="number"
                        min={1}
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        className="w-20 bg-zinc-900 border border-zinc-700 rounded-sm px-2 py-1 text-[12px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                    <span className="text-[11px] text-zinc-500">days</span>
                    <button
                        onClick={runQuery}
                        disabled={isLoading}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-orange-950 border border-orange-700 text-orange-300 text-[11px] font-semibold rounded-sm hover:bg-orange-900 transition-colors disabled:opacity-50"
                    >
                        <Search className="w-3 h-3" />
                        {isLoading ? "Running…" : "Run Query"}
                    </button>
                </div>

                {error && (
                    <div className="text-[11px] text-red-400 bg-red-950 border border-red-800 rounded-sm px-3 py-1.5">
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {!result ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-700">
                        <Search className="w-8 h-8" />
                        <span className="text-[11px]">Run a query to see inactive businesses</span>
                    </div>
                ) : (
                    <>
                        {/* Result summary */}
                        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/40">
                            <span className="text-[11px] text-zinc-500">
                                Found
                            </span>
                            <span className="font-mono text-[14px] font-bold text-orange-400">
                                {result.inactive_count}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                                businesses with no events in the last{" "}
                                <span className="font-mono text-zinc-300">{result.threshold_days}</span> days
                            </span>
                        </div>

                        {result.ubids.length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-zinc-600 text-[11px]">
                                No inactive businesses found for this threshold.
                            </div>
                        ) : (
                            result.ubids.map((u) => {
                                const m = STATUS_META[u.status] ?? STATUS_META.dormant;
                                return (
                                    <button
                                        key={u.ubid}
                                        onClick={() => onSelectUbid(u.ubid)}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 border-b border-zinc-800/50 text-left hover:bg-zinc-900 transition-colors"
                                    >
                                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", m.dot)} />
                                        <span className="font-mono text-[12px] text-zinc-200 flex-1">{u.ubid}</span>
                                        <span className={cn("text-[10px] uppercase font-semibold tracking-wider", m.color)}>
                                            {u.status}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-600">
                                            {(u.confidence_score * 100).toFixed(0)}%
                                        </span>
                                        <span className="text-[10px] text-zinc-600 ml-1">→ view events</span>
                                    </button>
                                );
                            })
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
