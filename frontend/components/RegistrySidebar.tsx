"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type Business = { ubid: string; status: "active" | "dormant" | "closed" };

interface RegistrySidebarProps {
  businesses: Business[];
  activeUbid: string | null;
  onSelect: (ubid: string) => void;
  isLoading: boolean;
}

export function RegistrySidebar({ businesses, activeUbid, onSelect, isLoading }: RegistrySidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          UBID Registry
        </span>
        <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
          {businesses.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-3 py-4 text-[11px] text-zinc-600 text-center uppercase tracking-widest animate-pulse">
            Loading...
          </div>
        ) : businesses.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-zinc-600 text-center">
            Registry is empty
          </div>
        ) : (
          businesses.map((biz) => (
            <RegistryRow
              key={biz.ubid}
              biz={biz}
              isActive={biz.ubid === activeUbid}
              onClick={() => onSelect(biz.ubid)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function RegistryRow({
  biz,
  isActive,
  onClick,
}: {
  biz: Business;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 border-b border-zinc-800/60 flex items-center gap-2 transition-colors",
        isActive
          ? "bg-zinc-800 border-l-2 border-l-sky-500"
          : "hover:bg-zinc-900"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[11px] font-mono text-zinc-300 truncate font-semibold">
            {biz.ubid}
          </span>
        </div>
        <StatusBadge status={biz.status} />
      </div>
      {isActive && (
        <ChevronRight className="w-3 h-3 text-sky-500 flex-shrink-0" />
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: Business["status"] }) {
  const map: Record<string, string> = {
    active: "text-emerald-500",
    dormant: "text-yellow-500",
    closed: "text-red-500",
  };
  return (
    <span className={cn("text-[9px] uppercase tracking-widest font-semibold", map[status] ?? "text-zinc-500")}>
      {status}
    </span>
  );
}
