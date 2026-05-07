"use client";

import { cn, formatScore, scoreColor, scoreBg } from "@/lib/utils";
import type { ReviewQueueItem } from "@/lib/types";
import { ChevronRight } from "lucide-react";

interface QueueSidebarProps {
  queue: ReviewQueueItem[];
  activePairId: string | null;
  onSelect: (pairId: string) => void;
}

export function QueueSidebar({ queue, activePairId, onSelect }: QueueSidebarProps) {
  const pending = queue.filter((p) => p.status === "pending");
  const resolved = queue.filter((p) => p.status !== "pending");

  return (
    <aside className="w-56 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Review Queue
        </span>
        <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
          {pending.length}
        </span>
      </div>

      {/* Pending */}
      <div className="flex-1 overflow-y-auto">
        {pending.length === 0 && (
          <div className="px-3 py-4 text-[11px] text-zinc-600 text-center">
            No pending pairs
          </div>
        )}
        {pending.map((item) => (
          <QueueRow
            key={item.pair_id}
            item={item}
            isActive={item.pair_id === activePairId}
            onClick={() => onSelect(item.pair_id)}
          />
        ))}

        {/* Resolved section */}
        {resolved.length > 0 && (
          <>
            <div className="px-3 py-1.5 border-t border-zinc-800 mt-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                Resolved
              </span>
            </div>
            {resolved.map((item) => (
              <QueueRow
                key={item.pair_id}
                item={item}
                isActive={item.pair_id === activePairId}
                onClick={() => onSelect(item.pair_id)}
                dimmed
              />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

function QueueRow({
  item,
  isActive,
  onClick,
  dimmed = false,
}: {
  item: ReviewQueueItem;
  isActive: boolean;
  onClick: () => void;
  dimmed?: boolean;
}) {
  const scoreStr = formatScore(item.splink_score);
  const colorClass = scoreColor(item.splink_score);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 border-b border-zinc-800/60 flex items-center gap-2 transition-colors",
        isActive
          ? "bg-zinc-800 border-l-2 border-l-emerald-500"
          : "hover:bg-zinc-900",
        dimmed && "opacity-50"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-mono text-zinc-400 truncate">
            {item.pair_id}
          </span>
          <span className={cn("text-[11px] font-mono font-bold flex-shrink-0", colorClass)}>
            {scoreStr}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-zinc-500 truncate">
            {item.record_a_id}
          </span>
          <span className="text-zinc-700 text-[10px]">↔</span>
          <span className="text-[10px] text-zinc-500 truncate">
            {item.record_b_id}
          </span>
        </div>
        <StatusBadge status={item.status} />
      </div>
      {isActive && (
        <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: ReviewQueueItem["status"] }) {
  const map: Record<string, string> = {
    pending: "text-yellow-500",
    merged: "text-emerald-500",
    separated: "text-blue-400",
    escalated: "text-orange-400",
  };
  return (
    <span className={cn("text-[9px] uppercase tracking-widest font-semibold", map[status] ?? "text-zinc-500")}>
      {status}
    </span>
  );
}
