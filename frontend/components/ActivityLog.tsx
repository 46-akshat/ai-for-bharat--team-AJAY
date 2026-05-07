"use client";

import { cn, formatTimestamp } from "@/lib/utils";
import type { ActivityEntry, Decision } from "@/lib/types";
import { GitMerge, Scissors, AlertTriangle, RotateCcw, CheckCircle2 } from "lucide-react";

interface ActivityLogProps {
  entries: ActivityEntry[];
  onUndo: (entryId: string) => void;
}

const DECISION_ICON: Record<Decision, React.ReactNode> = {
  merge: <GitMerge className="w-3 h-3 text-emerald-400" />,
  separate: <Scissors className="w-3 h-3 text-blue-400" />,
  escalate: <AlertTriangle className="w-3 h-3 text-orange-400" />,
};

const DECISION_COLOR: Record<Decision, string> = {
  merge: "text-emerald-400",
  separate: "text-blue-400",
  escalate: "text-orange-400",
};

const DECISION_LABEL: Record<Decision, string> = {
  merge: "Merged",
  separate: "Separated",
  escalate: "Escalated",
};

export function ActivityLog({ entries, onUndo }: ActivityLogProps) {
  return (
    <div className="border-t border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-1.5 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
          Activity Log
        </span>
        <span className="text-[10px] font-mono text-zinc-600">
          {entries.length} action{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Entries */}
      <div className="max-h-32 overflow-y-auto">
        {entries.length === 0 && (
          <div className="px-4 py-3 text-[11px] text-zinc-700 text-center">
            No decisions yet — start reviewing pairs above.
          </div>
        )}
        {[...entries].reverse().map((entry) => (
          <LogEntry key={entry.id} entry={entry} onUndo={onUndo} />
        ))}
      </div>
    </div>
  );
}

function LogEntry({
  entry,
  onUndo,
}: {
  entry: ActivityEntry;
  onUndo: (id: string) => void;
}) {
  const isRecent =
    Date.now() - new Date(entry.timestamp).getTime() < 30_000;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 border-b border-zinc-800/40 text-[11px]",
        entry.undone && "opacity-40 line-through"
      )}
    >
      {/* Icon */}
      <span className="flex-shrink-0">{DECISION_ICON[entry.decision]}</span>

      {/* Message */}
      <span className="text-zinc-400 flex-1 min-w-0 truncate">
        <span className={cn("font-semibold", DECISION_COLOR[entry.decision])}>
          {DECISION_LABEL[entry.decision]}
        </span>{" "}
        <span className="font-mono text-zinc-300">{entry.record_a_name}</span>
        <span className="text-zinc-600"> ↔ </span>
        <span className="font-mono text-zinc-300">{entry.record_b_name}</span>
        {entry.ubid && (
          <span className="text-zinc-600">
            {" "}→{" "}
            <span className="font-mono text-emerald-400">{entry.ubid}</span>
          </span>
        )}
      </span>

      {/* Timestamp */}
      <span className="text-zinc-700 font-mono text-[10px] flex-shrink-0">
        {formatTimestamp(entry.timestamp)}
      </span>

      {/* Undo button — only for recent, non-undone entries */}
      {isRecent && !entry.undone && (
        <button
          onClick={() => onUndo(entry.id)}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-1.5 py-0.5 rounded-sm transition-colors flex-shrink-0"
          title="Undo this decision"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Undo
        </button>
      )}

      {entry.undone && (
        <span className="text-[10px] text-zinc-600 flex-shrink-0">undone</span>
      )}
    </div>
  );
}
