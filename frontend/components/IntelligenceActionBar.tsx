"use client";

import { cn } from "@/lib/utils";
import { CheckSquare, Flag, DownloadCloud } from "lucide-react";

interface IntelligenceActionBarProps {
  onAction?: (action: string) => void;
  disabled?: boolean;
}

export function IntelligenceActionBar({ onAction, disabled }: IntelligenceActionBarProps) {
  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2.5 flex items-center gap-3">
      {/* Label */}
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-2">
        Actions
      </span>

      {/* Acknowledge */}
      <ActionButton
        label="Acknowledge"
        sublabel="Mark viewed"
        shortcut="A"
        icon={<CheckSquare className="w-3.5 h-3.5" />}
        onClick={() => onAction?.("acknowledge")}
        disabled={disabled}
        variant="acknowledge"
      />

      {/* Flag */}
      <ActionButton
        label="Flag"
        sublabel="Needs review"
        shortcut="F"
        icon={<Flag className="w-3.5 h-3.5" />}
        onClick={() => onAction?.("flag")}
        disabled={disabled}
        variant="flag"
      />

      {/* Export */}
      <ActionButton
        label="Export"
        sublabel="Download report"
        shortcut="D"
        icon={<DownloadCloud className="w-3.5 h-3.5" />}
        onClick={() => onAction?.("export")}
        disabled={disabled}
        variant="export"
      />

      {/* Keyboard hint */}
      <div className="ml-auto text-[10px] text-zinc-700">
        Keyboard: <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">A</kbd>{" "}
        <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">F</kbd>{" "}
        <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">D</kbd>
      </div>
    </div>
  );
}

type ButtonVariant = "acknowledge" | "flag" | "export";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  acknowledge:
    "border-emerald-700 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500 focus:ring-emerald-700",
  flag:
    "border-orange-700 text-orange-300 hover:bg-orange-900/40 hover:border-orange-500 focus:ring-orange-700",
  export:
    "border-blue-700 text-blue-300 hover:bg-blue-900/40 hover:border-blue-500 focus:ring-blue-700",
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
