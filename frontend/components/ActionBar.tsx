"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { GitMerge, Scissors, AlertTriangle, Loader2 } from "lucide-react";
import type { Decision } from "@/lib/types";

interface ActionBarProps {
  onDecide: (decision: Decision) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ActionBar({ onDecide, isLoading, disabled }: ActionBarProps) {
  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled || isLoading) return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") onDecide("merge");
      if (e.key === "s" || e.key === "S") onDecide("separate");
      if (e.key === "e" || e.key === "E") onDecide("escalate");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDecide, disabled, isLoading]);

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2.5 flex items-center gap-3">
      {/* Label */}
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-2">
        Decision
      </span>

      {/* Merge */}
      <ActionButton
        label="Merge"
        sublabel="Same business"
        shortcut="M"
        icon={<GitMerge className="w-3.5 h-3.5" />}
        onClick={() => onDecide("merge")}
        disabled={disabled || isLoading}
        variant="merge"
      />

      {/* Separate */}
      <ActionButton
        label="Separate"
        sublabel="Distinct entities"
        shortcut="S"
        icon={<Scissors className="w-3.5 h-3.5" />}
        onClick={() => onDecide("separate")}
        disabled={disabled || isLoading}
        variant="separate"
      />

      {/* Escalate */}
      <ActionButton
        label="Escalate"
        sublabel="Senior review"
        shortcut="E"
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
        onClick={() => onDecide("escalate")}
        disabled={disabled || isLoading}
        variant="escalate"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-1.5 ml-2 text-zinc-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-[11px]">Submitting…</span>
        </div>
      )}

      {/* Keyboard hint */}
      <div className="ml-auto text-[10px] text-zinc-700">
        Keyboard: <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">M</kbd>{" "}
        <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">S</kbd>{" "}
        <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">E</kbd>
      </div>
    </div>
  );
}

type ButtonVariant = "merge" | "separate" | "escalate";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  merge:
    "border-emerald-700 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500 focus:ring-emerald-700",
  separate:
    "border-blue-700 text-blue-300 hover:bg-blue-900/40 hover:border-blue-500 focus:ring-blue-700",
  escalate:
    "border-orange-700 text-orange-300 hover:bg-orange-900/40 hover:border-orange-500 focus:ring-orange-700",
};

function ActionButton({
  label,
  sublabel,
  shortcut,
  icon,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  sublabel: string;
  shortcut: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: ButtonVariant;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 border rounded-sm text-[12px] font-semibold",
        "transition-all duration-100 focus:outline-none focus:ring-1 focus:ring-offset-0",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "bg-zinc-900",
        VARIANT_STYLES[variant]
      )}
    >
      {icon}
      <div className="flex flex-col items-start leading-none">
        <span>{label}</span>
        <span className="text-[9px] font-normal opacity-60 mt-0.5">{sublabel}</span>
      </div>
      <kbd className="ml-1 text-[9px] font-mono bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded opacity-60">
        {shortcut}
      </kbd>
    </button>
  );
}
