"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, RefreshCw } from "lucide-react";
import { StatusOverview } from "@/components/StatusOverview";
import { EventTimeline } from "@/components/EventTimeline";
import { InactiveQuery } from "@/components/InactiveQuery";
import { PartBRunner } from "@/components/PartBRunner";
import { fetchUBIDStatuses, fetchEvents } from "@/lib/api";
import type { UBIDStatus, BusinessEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "overview" | "compliance";

export default function IntelligencePage() {
    const [tab, setTab] = useState<Tab>("overview");
    const [ubids, setUbids] = useState<UBIDStatus[]>([]);
    const [selectedUbid, setSelectedUbid] = useState<string | null>(null);
    const [events, setEvents] = useState<BusinessEvent[]>([]);
    const [isLoadingUbids, setIsLoadingUbids] = useState(true);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [showRunner, setShowRunner] = useState(false);

    const loadUbids = useCallback(async () => {
        setIsLoadingUbids(true);
        try {
            const data = await fetchUBIDStatuses();
            // Sort: active first, then dormant, then closed
            const order = { active: 0, dormant: 1, closed: 2 };
            data.sort((a, b) => order[a.status] - order[b.status]);
            setUbids(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingUbids(false);
        }
    }, []);

    useEffect(() => { loadUbids(); }, [loadUbids]);

    // Load events when a UBID is selected
    useEffect(() => {
        if (!selectedUbid) { setEvents([]); return; }
        setIsLoadingEvents(true);
        fetchEvents(selectedUbid, 200)
            .then(data => {
                // Sort newest first
                data.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
                setEvents(data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingEvents(false));
    }, [selectedUbid]);

    const selectedUbidInfo = ubids.find(u => u.ubid === selectedUbid) ?? null;

    function handleSelectUbid(ubid: string) {
        setSelectedUbid(ubid);
        setTab("overview"); // switch to overview so timeline is visible
    }

    return (
        <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-950 flex items-stretch flex-shrink-0">
                <div className="flex items-center gap-3 px-4 border-r border-zinc-800 flex-shrink-0">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[13px] font-bold tracking-tight text-zinc-100">KA-UBID</span>
                        <span className="text-[9px] uppercase tracking-widest text-indigo-400">Business Intelligence</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800" />
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Review
                    </Link>
                    <Link
                        href="/pipeline"
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Pipeline
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex items-end px-4 gap-1">
                    {([
                        { id: "overview", label: "Status Overview" },
                        { id: "compliance", label: "Compliance Query" },
                    ] as { id: Tab; label: string }[]).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                "px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors",
                                tab === t.id
                                    ? "border-indigo-500 text-indigo-300"
                                    : "border-transparent text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-2 px-4 border-l border-zinc-800">
                    <button
                        onClick={() => setShowRunner(v => !v)}
                        className={cn(
                            "flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 border rounded-sm transition-colors",
                            showRunner
                                ? "bg-indigo-950 border-indigo-700 text-indigo-300"
                                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <RefreshCw className="w-3 h-3" />
                        Run Part B
                    </button>
                    <button
                        onClick={loadUbids}
                        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 rounded-sm transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                    </button>
                </div>
            </header>

            {/* Part B runner panel (collapsible) */}
            {showRunner && (
                <div className="border-b border-zinc-800 p-4 bg-zinc-900/30 flex-shrink-0">
                    <PartBRunner onComplete={() => { loadUbids(); setShowRunner(false); }} />
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex">
                {tab === "overview" ? (
                    <>
                        {/* Left: UBID list */}
                        <div className="w-72 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
                            <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                                    Businesses
                                </span>
                                <span className="text-[10px] font-mono text-zinc-600">{ubids.length} total</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <StatusOverview
                                    ubids={ubids}
                                    selectedUbid={selectedUbid}
                                    onSelect={setSelectedUbid}
                                    isLoading={isLoadingUbids}
                                />
                            </div>
                        </div>

                        {/* Right: Event timeline */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="px-3 py-2 border-b border-zinc-800">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                                    Event Timeline
                                </span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <EventTimeline
                                    ubid={selectedUbid}
                                    ubidInfo={selectedUbidInfo}
                                    events={events}
                                    isLoading={isLoadingEvents}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    /* Compliance tab — full width */
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-3 py-2 border-b border-zinc-800">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                                Inactive Business Query
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <InactiveQuery onSelectUbid={handleSelectUbid} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
