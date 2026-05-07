"use client";

import { cn, deptBadgeClass } from "@/lib/utils";
import type { CanonicalRecord } from "@/lib/types";

interface ComparisonTableProps {
  recordA: CanonicalRecord;
  recordB: CanonicalRecord;
}

interface FieldDef {
  key: keyof CanonicalRecord;
  label: string;
  mono?: boolean;
  render?: (val: string, other: string) => React.ReactNode;
}

const FIELDS: FieldDef[] = [
  {
    key: "source_dept",
    label: "Source Dept",
    render: (val) => (
      <span
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 border rounded-sm",
          deptBadgeClass(val)
        )}
      >
        {val}
      </span>
    ),
  },
  { key: "raw_id", label: "Raw ID", mono: true },
  { key: "biz_name_raw", label: "Business Name" },
  { key: "address_raw", label: "Address" },
  { key: "pin", label: "PIN Code", mono: true },
  { key: "pan", label: "PAN Number", mono: true },
  { key: "gst", label: "GSTIN", mono: true },
  { key: "phone", label: "Phone", mono: true },
];

function valuesMatch(a: string, b: string): boolean {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase();
}

function highlightDiff(a: string, b: string): React.ReactNode {
  if (valuesMatch(a, b)) return a;
  // Character-level diff highlight for short strings
  if (a.length < 30 && b.length < 30) {
    return (
      <span>
        {a.split("").map((ch, i) => {
          const matches = b[i] === ch;
          return (
            <span
              key={i}
              className={matches ? "" : "bg-red-900/60 text-red-300"}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  }
  return a;
}

export function ComparisonTable({ recordA, recordB }: ComparisonTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-10">
            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold w-28 border-r border-zinc-800">
              Field
            </th>
            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold w-1/2 border-r border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                Record A
                <span className="font-mono text-zinc-600 text-[10px]">
                  {recordA.raw_id}
                </span>
              </div>
            </th>
            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold w-1/2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                Record B
                <span className="font-mono text-zinc-600 text-[10px]">
                  {recordB.raw_id}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {FIELDS.map((field, idx) => {
            const valA = String(recordA[field.key] ?? "—");
            const valB = String(recordB[field.key] ?? "—");
            const match = valuesMatch(valA, valB);

            return (
              <tr
                key={field.key}
                className={cn(
                  "border-b border-zinc-800/60 transition-colors",
                  match
                    ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                    : "bg-red-950/10 hover:bg-red-950/20",
                  idx % 2 === 0 && !match && "bg-red-950/15"
                )}
              >
                {/* Field label */}
                <td className="px-3 py-2 border-r border-zinc-800 align-top">
                  <div className="flex items-center gap-1.5">
                    <MatchIndicator match={match} />
                    <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">
                      {field.label}
                    </span>
                  </div>
                </td>

                {/* Record A value */}
                <td className="px-3 py-2 border-r border-zinc-800 align-top">
                  {field.render ? (
                    field.render(valA, valB)
                  ) : (
                    <span
                      className={cn(
                        "leading-snug",
                        field.mono
                          ? "font-mono text-[11px] text-zinc-200"
                          : "text-zinc-200",
                        !match && "font-medium"
                      )}
                    >
                      {field.mono && !match
                        ? highlightDiff(valA, valB)
                        : valA}
                    </span>
                  )}
                </td>

                {/* Record B value */}
                <td className="px-3 py-2 align-top">
                  {field.render ? (
                    field.render(valB, valA)
                  ) : (
                    <span
                      className={cn(
                        "leading-snug",
                        field.mono
                          ? "font-mono text-[11px] text-zinc-200"
                          : "text-zinc-200",
                        !match && "font-medium"
                      )}
                    >
                      {field.mono && !match
                        ? highlightDiff(valB, valA)
                        : valB}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-950/60 border border-emerald-800/40" />
          <span className="text-[10px] text-zinc-600">Exact match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-950/40 border border-red-800/40" />
          <span className="text-[10px] text-zinc-600">Mismatch / differs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-900/60 border border-red-700/40" />
          <span className="text-[10px] text-zinc-600">Differing characters</span>
        </div>
      </div>
    </div>
  );
}

function MatchIndicator({ match }: { match: boolean }) {
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full flex-shrink-0",
        match ? "bg-emerald-500" : "bg-red-500"
      )}
    />
  );
}
