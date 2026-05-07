"use client";

import { cn } from "@/lib/utils";
import type { BusinessEvent, UBIDStatus } from "@/lib/types";
import { Zap, Wrench, FileText, AlertTriangle, XCircle, Clock } from "lucide-react";

interface EventTimelineProps {
    ubid: string | null;
    ubidInfo: UBIDStatus | null;
    events: BusinessEvent[];
    isLoading: boolean;
}

const WEIGHT_META = {
    HIGH: { color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800", bar: "bg-emerald-500", icon: Zap },
    MED: { color: "text-yellow-400", bg: "bg-yellow-950 border-yellow-800", bar: "bg-yellow-500", icon: Wrench },
    LOW: { color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", bar: "bg-zinc-500", icon: FileText },
    CLOSURE: { color: "text-red-400", bg: "bg-red-950 border-red-800", bar: "bg-red-500", icon: XCircle },
} as const;

const STATUS_COLOR = {
    active: "text-emerald-400",
    dormant: "text-yellow-400",
    closed: "text-red-400",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function formatEventType(t: string) {
    return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function EventTimeline({ ubid, ubidInfo, events, isLoading }: EventTimelineProps) {
    if (!ubid) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-2 text-zinc-600">
                <Clock className="w-8 h-8 text-zinc-700" />
                <span className="text-[12px]">Select a business to view its event timeline</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* UBID header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-4">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">Business ID</div>
                    <div className="font-mono text-[14px] font-bold text-zinc-100">{ubid}</div>
                </div>
                {ubidInfo && (
                    <>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Status</div>
                            <div className={cn("text-[13px] font-semibold uppercase", STATUS_COLOR[ubidInfo.status])}>
                                {ubidInfo.status}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Confidence</div>
                            <div className="font-mono text-[13px] text-zinc-300">
                                {(ubidInfo.confidence_score * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Events</div>
                            <div className="font-mono text-[13px] text-zinc-300">{events.length}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Signal weight legend */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-1">Signal</span>
                {(["HIGH", "MED", "LOW", "CLOSURE"] as const).map(w => {
                    const m = WEIGHT_META[w];
                    return (
                        <span key={w} className={cn("text-[10px] font-semibold px-1.5 py-0.5 border rounded-sm", m.color, m.bg)}>
                            {w}
                        </span>
                    );
                })}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-24 text-zinc-600 text-[11px]">Loading events…</div>
                ) : events.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-zinc-600 text-[11px]">No events recorded for this business.</div>
                ) : (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />
                        <div className="space-y-0">
                            {events.map((ev, i) => {
                                const m = WEIGHT_META[ev.signal_weight] ?? WEIGHT_META.LOW;
                                const Icon = m.icon;
                                return (
                                    <div key={ev.event_id} className="flex gap-3 pb-3">
                                        {/* Dot on timeline */}
                                        <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 z-10", m.bar, "border-zinc-950")} />
                                        {/* Content */}
                                        <div className={cn("flex-1 border rounded-sm px-3 py-2", m.bg)}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={cn("w-3 h-3 flex-shrink-0", m.color)} />
                                                <span className={cn("text-[12px] font-semibold", m.color)}>
                                                    {formatEventType(ev.event_type)}
                                                </span>
                                                <span className={cn("ml-auto text-[10px] font-semibold uppercase px-1 py-0.5 border rounded-sm", m.color, m.bg)}>
                                                    {ev.signal_weight}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-zinc-500 font-mono">{formatDate(ev.occurred_at)}</span>
                                                <span className="text-[10px] text-zinc-600">·</span>
                                                <span className="text-[10px] text-zinc-500 capitalize">{ev.source_dept}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
