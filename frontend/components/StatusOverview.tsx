"use client";

import { cn } from "@/lib/utils";
import type { UBIDStatus } from "@/lib/types";
import { Activity, Moon, XCircle, ChevronRight } from "lucide-react";

interface StatusOverviewProps {
    ubids: UBIDStatus[];
    selectedUbid: string | null;
    onSelect: (ubid: string) => void;
    isLoading: boolean;
}

const STATUS_META = {
    active: { label: "Active", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800", dot: "bg-emerald-400" },
    dormant: { label: "Dormant", icon: Moon, color: "text-yellow-400", bg: "bg-yellow-950 border-yellow-800", dot: "bg-yellow-400" },
    closed: { label: "Closed", icon: XCircle, color: "text-red-400", bg: "bg-red-950 border-red-800", dot: "bg-red-500" },
} as const;

export function StatusOverview({ ubids, selectedUbid, onSelect, isLoading }: StatusOverviewProps) {
    const counts = {
        active: ubids.filter(u => u.status === "active").length,
        dormant: ubids.filter(u => u.status === "dormant").length,
        closed: ubids.filter(u => u.status === "closed").length,
    };

    return (
        <div className="flex flex-col h-full">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 p-3 border-b border-zinc-800">
                {(["active", "dormant", "closed"] as const).map((s) => {
                    const m = STATUS_META[s];
                    const Icon = m.icon;
                    return (
                        <div key={s} className={cn("border rounded-sm px-3 py-2 flex items-center gap-2", m.bg)}>
                            <Icon className={cn("w-4 h-4 flex-shrink-0", m.color)} />
                            <div>
                                <div className={cn("text-xl font-mono font-bold leading-none", m.color)}>
                                    {counts[s]}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                                    {m.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* UBID list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-24 text-zinc-600 text-[11px]">
                        Loading…
                    </div>
                ) : ubids.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-zinc-600 text-[11px]">
                        No UBIDs found. Run the pipeline first.
                    </div>
                ) : (
                    ubids.map((u) => {
                        const m = STATUS_META[u.status];
                        return (
                            <button
                                key={u.ubid}
                                onClick={() => onSelect(u.ubid)}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-2 border-b border-zinc-800/50 text-left hover:bg-zinc-900 transition-colors",
                                    selectedUbid === u.ubid && "bg-zinc-900 border-l-2 border-l-emerald-500"
                                )}
                            >
                                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", m.dot)} />
                                <span className="font-mono text-[12px] text-zinc-200 flex-1">{u.ubid}</span>
                                <span className={cn("text-[10px] uppercase font-semibold tracking-wider", m.color)}>
                                    {u.status}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-600">
                                    {(u.confidence_score * 100).toFixed(0)}%
                                </span>
                                <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
