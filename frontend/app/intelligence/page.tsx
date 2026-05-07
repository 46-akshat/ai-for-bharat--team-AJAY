"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ShieldCheck, AlertTriangle, XCircle, ArrowLeft, Building2 } from "lucide-react";

// Types
type Business = { ubid: string; status: "active" | "dormant" | "closed" };
type Event = { event_id: string; event_type: string; signal_weight: string; source_dept: string; occurred_at: string };

function IntelligenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUbid = searchParams.get("ubid");

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedUbid, setSelectedUbid] = useState<string | null>(initialUbid);
  const [timeline, setTimeline] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Businesses from your FastAPI Backend
  useEffect(() => {
    fetch('http://localhost:8000/api/ubids/status')
      .then(res => res.json())
      .then(data => {
        setBusinesses(data);
        setIsLoading(false);
      })
      .catch(err => console.error("API Error:", err));
  }, []);

  // Fetch Timeline when UBID is selected
  useEffect(() => {
    if (!selectedUbid) return;
    fetch(`http://localhost:8000/api/events?ubid=${selectedUbid}`)
      .then(res => res.json())
      .then(data => setTimeline(data));
  }, [selectedUbid]);

  const activeCount = businesses.filter(b => b.status === 'active').length;
  const dormantCount = businesses.filter(b => b.status === 'dormant').length;
  const closedCount = businesses.filter(b => b.status === 'closed').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-[var(--accent)] rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Back to Part A (Resolution)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[14px] font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Intelligence Engine
            </h1>
            <p className="text-[11px] text-[var(--muted-fg)] uppercase tracking-wider mt-0.5">Automated Compliance Monitoring</p>
          </div>
        </div>

        {/* Status Breakdown Indicators */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-mono text-zinc-300">{activeCount} Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-[11px] font-mono text-zinc-300">{dormantCount} Dormant</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-[11px] font-mono text-zinc-300">{closedCount} Closed</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: UBID Registry */}
        <div className="w-80 flex flex-col border-r border-[var(--border)] bg-[var(--muted)]/10">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-[12px] font-semibold text-zinc-300">Registry ({businesses.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-[11px] text-zinc-500 text-center uppercase tracking-widest animate-pulse">Loading Registry...</div>
            ) : (
              businesses.map((biz) => (
                <button
                  key={biz.ubid}
                  onClick={() => setSelectedUbid(biz.ubid)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border)] transition-colors hover:bg-[var(--accent)]/50 ${
                    selectedUbid === biz.ubid ? 'bg-[var(--accent)] border-l-2 border-l-sky-500' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-mono text-zinc-200">{biz.ubid}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      biz.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      biz.status === 'dormant' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {biz.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Evidence Timeline */}
        <div className="flex-1 flex flex-col bg-[var(--background)]">
          {!selectedUbid ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-3">
               <Building2 className="w-8 h-8 text-zinc-700" />
               <span className="text-[13px] font-semibold text-zinc-400">Select a Business</span>
               <span className="text-[11px] text-zinc-600">Choose a UBID from the registry to view its department logs.</span>
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-[14px] font-semibold mb-6 flex items-center gap-2 border-b border-[var(--border)] pb-4 text-zinc-200">
                Evidence History: <span className="font-mono text-sky-400">{selectedUbid}</span>
              </h2>
              
              {timeline.length === 0 ? (
                <p className="text-[12px] text-zinc-500 italic">No department events found for this UBID.</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event) => (
                    <div key={event.event_id} className="flex gap-4 p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 hover:bg-[var(--muted)]/80 transition-colors">
                      <div className="mt-1">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                          event.signal_weight === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          event.signal_weight === 'MED' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {event.signal_weight}
                        </span>
                      </div>
                      <div>
                        <strong className="block text-[13px] text-zinc-200 mb-1">{event.event_type.replace(/_/g, ' ').toUpperCase()}</strong>
                        <div className="flex gap-4 text-[11px] text-zinc-500 font-mono">
                          <span>Dept: <span className="text-zinc-400">{event.source_dept}</span></span>
                          <span>Date: <span className="text-zinc-400">{new Date(event.occurred_at).toLocaleDateString()}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper required by Next.js for useSearchParams
export default function IntelligenceDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500 text-sm">Loading Engine...</div>}>
      <IntelligenceContent />
    </Suspense>
  );
}