"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PipelineTableProps {
  stepIndex: number;
  results: Record<number, any>;
}

export function PipelineTable({ stepIndex, results }: PipelineTableProps) {
  const currentResult = results[stepIndex];
  
  const normalizeData = useMemo(() => {
    return results[1]?.data || [];
  }, [results]);

  if (stepIndex === -1) {
    return <div className="text-zinc-500 italic p-4">Waiting for pipeline step data...</div>;
  }

  if (!currentResult || !currentResult.data) {
    return <div className="text-zinc-500 italic p-4">No data returned for this step.</div>;
  }

  const data = currentResult.data;

  // Step 4: Decision (Completed)
  if (stepIndex === 4) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <h3 className="text-xl font-medium text-zinc-200 mb-2">Pipeline Execution Finished</h3>
        <p className="text-zinc-400 mb-8">{data.message || data}</p>
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Navigate to Reviewer Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Helper to format generic tables
  const renderGenericTable = (rows: any[]) => {
    if (!Array.isArray(rows) || rows.length === 0) return <div>No rows</div>;
    const cols = Object.keys(rows[0]);
    return (
      <div className="overflow-auto max-h-[600px] border border-zinc-800 rounded">
        <table className="w-full text-left text-[11px] text-zinc-300">
          <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 font-medium border-b border-zinc-800">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-zinc-800/30">
                {cols.map((c) => (
                  <td key={c} className="px-3 py-2 max-w-[200px] truncate">{String(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Step 0: Generate
  if (stepIndex === 0) {
    // data is { factories: [], shops: [], bescom: [] }
    const combined = [
      ...(data.factories || []).map((x: any) => ({ source: 'factories', ...x })),
      ...(data.shops || []).map((x: any) => ({ source: 'shops', ...x })),
      ...(data.bescom || []).map((x: any) => ({ source: 'bescom', ...x })),
    ].slice(0, 50); // Preview a fraction
    return renderGenericTable(combined);
  }

  // Step 1: Normalize
  if (stepIndex === 1) {
    return renderGenericTable(data);
  }

  // Step 2: Pair (Blocking)
  if (stepIndex === 2) {
    let rows = [...(Array.isArray(data) ? data : [])];
    
    // Sort by gst_candidate_sets (nulls last)
    rows.sort((a, b) => {
      const gA = a.gst_candidate_sets || a.gst_candidate_set;
      const gB = b.gst_candidate_sets || b.gst_candidate_set;
      if (!gA && !gB) return 0;
      if (!gA) return 1;
      if (!gB) return -1;
      return String(gA).localeCompare(String(gB));
    });
    
    return renderGenericTable(rows);
  }

  // Step 3: Score
  if (stepIndex === 3) {
    let rows = Array.isArray(data) ? data : [];
    
    // Map URIs to Space Separated Data from Normalize step
    const mapUriToEntity = (uri: any) => {
      if (!normalizeData || normalizeData.length === 0) return "";
      const searchUri = String(uri).trim();
      const match = normalizeData.find((r: any) => String(r.uri).trim() === searchUri || String(r.raw_id).trim() === searchUri);
      if (!match) return "";
      
      // Concat all values space separated, but exclude the URI itself to avoid repetition
      return Object.entries(match)
        .filter(([k, v]) => v !== null && v !== "" && String(v).trim() !== searchUri)
        .map(([k, v]) => v)
        .join(" | ");
    };

    return (
      <div className="overflow-auto max-h-[600px] border border-zinc-800 rounded">
        <table className="w-full text-left text-[11px] text-zinc-300">
          <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
            <tr>
              <th className="px-3 py-2 font-medium border-b border-zinc-800">Record L</th>
              <th className="px-3 py-2 font-medium border-b border-zinc-800">Record R</th>
              <th className="px-3 py-2 font-medium border-b border-zinc-800 w-24">Probability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((r, i) => {
              // Guess the keys depending on script output
              const uriL = r.URI_L || r.URIL || r.uri_l || r.unique_id_l || r.record_a_id;
              const uriR = r.URI_R || r.URIR || r.uri_r || r.unique_id_r || r.record_b_id;
              const prob = r.score || r.probability || r.match_score || r.match_probability || r.match_weight || 0;

              return (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="px-3 py-2">
                    <div className="text-emerald-400 mb-1 opacity-70 break-all">{String(uriL)}</div>
                    <div className="line-clamp-2 text-zinc-300 leading-relaxed">{mapUriToEntity(uriL)}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sky-400 mb-1 opacity-70 break-all">{String(uriR)}</div>
                    <div className="line-clamp-2 text-zinc-300 leading-relaxed">{mapUriToEntity(uriR)}</div>
                  </td>
                  <td className="px-3 py-2 font-mono">{Number(prob).toFixed(4)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return <div>Unknown Step Output</div>;
}
