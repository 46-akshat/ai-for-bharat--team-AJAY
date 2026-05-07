"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: any;
  className?: string;
  title?: string;
}

export function JsonViewer({ data, className, title }: JsonViewerProps) {
  return (
    <div className={cn("rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col", className)}>
      {title && (
        <div className="bg-zinc-950 px-3 py-1.5 border-b border-zinc-800 flex items-center">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
        </div>
      )}
      <div className="p-3 overflow-auto flex-1">
        <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
