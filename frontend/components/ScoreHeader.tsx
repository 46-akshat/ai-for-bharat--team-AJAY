"use client";

import { cn, formatScore, scoreColor, scoreBg, scoreLabel } from "@/lib/utils";
import type { ReviewQueueItem } from "@/lib/types";

interface ScoreHeaderProps {
  pair: ReviewQueueItem;
}

const BAYES_LABEL: Record<string, string> = {
  pan: "PAN",
  gst: "GST",
  biz_name_norm: "Biz Name",
  address_norm: "Address",
  pin: "PIN",
  phone: "Phone",
};

export function ScoreHeader({ pair }: ScoreHeaderProps) {
  const score = pair.splink_score;
  const pct = formatScore(score);
  const colorClass = scoreColor(score);
  const bgClass = scoreBg(score);
  const label = scoreLabel(score);

  return (
    <div className={cn("border-b border-zinc-800 px-4 py-2.5 flex items-center gap-6", "bg-zinc-950")}>
      {/* Main score */}
      <div className={cn("flex items-center gap-3 border px-3 py-1.5 rounded-sm", bgClass)}>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 leading-none mb-0.5">
            Splink Score
          </div>
          <div className={cn("text-2xl font-mono font-bold leading-none", colorClass)}>
            {pct}
          </div>
        </div>
        <div className={cn("text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 border rounded-sm", colorClass, bgClass)}>
          {label}
        </div>
      </div>

      {/* Pair ID */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Pair ID</span>
        <span className="text-[12px] font-mono text-zinc-300">{pair.pair_id}</span>
      </div>

      {/* Bayes factors */}
      {pair.bayes_factors && (
        <div className="flex items-center gap-3 ml-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-1">
            Bayes Factors
          </span>
          {Object.entries(pair.bayes_factors).map(([key, val]) => (
            <BayesPill key={key} label={BAYES_LABEL[key] ?? key} value={val} />
          ))}
        </div>
      )}

      {/* Status */}
      <div className="ml-auto flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Status</span>
        <span className="text-[11px] font-semibold uppercase text-yellow-400">
          {pair.status}
        </span>
      </div>
    </div>
  );
}

function BayesPill({ label, value }: { label: string; value: number }) {
  const isStrong = value >= 8;
  const isMed = value >= 3 && value < 8;
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          "text-[11px] font-mono font-bold leading-none",
          isStrong ? "text-emerald-400" : isMed ? "text-yellow-400" : "text-red-400"
        )}
      >
        {value.toFixed(1)}
      </span>
      <span className="text-[9px] text-zinc-600 leading-none mt-0.5">{label}</span>
    </div>
  );
}
