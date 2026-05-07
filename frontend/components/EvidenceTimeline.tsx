"use client";

import { Building2 } from "lucide-react";

type Event = { event_id: string; event_type: string; signal_weight: string; source_dept: string; occurred_at: string };

interface EvidenceTimelineProps {
  selectedUbid: string | null;
  timeline: Event[];
}

export function EvidenceTimeline({ selectedUbid, timeline }: EvidenceTimelineProps) {
  if (!selectedUbid) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Building2 className="w-8 h-8 text-zinc-700" />
          <span className="text-[13px] font-semibold text-zinc-400">Select a Business</span>
          <span className="text-[11px] text-zinc-600">Choose a UBID from the registry to view its department logs.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-[14px] font-semibold mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4 text-zinc-200">
        Evidence History: <span className="font-mono text-sky-400">{selectedUbid}</span>
      </h2>
      
      {timeline.length === 0 ? (
        <p className="text-[12px] text-zinc-500 italic">No department events found for this UBID.</p>
      ) : (
        <div className="space-y-4">
          {timeline.map((event) => (
            <div key={event.event_id} className="flex gap-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/80 transition-colors">
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
  );
}
