"use client";

import { useState, useCallback, useEffect } from "react";
import { QueueSidebar } from "./QueueSidebar";
import { ScoreHeader } from "./ScoreHeader";
import { ComparisonTable } from "./ComparisonTable";
import { ActionBar } from "./ActionBar";
import { ActivityLog } from "./ActivityLog";
import { fetchReviewQueue, fetchReviewPair, submitDecision } from "@/lib/api";
import { generateId } from "@/lib/utils";
import type {
  ReviewQueueItem,
  ReviewPairDetail,
  Decision,
  ActivityEntry,
} from "@/lib/types";
import { AlertCircle, Inbox } from "lucide-react";

const REVIEWER_ID = "reviewer_001";

export function ReviewDashboard() {
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [activePairId, setActivePairId] = useState<string | null>(null);
  const [pairDetail, setPairDetail] = useState<ReviewPairDetail | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isLoadingPair, setIsLoadingPair] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load queue on mount
  useEffect(() => {
    setIsLoadingQueue(true);
    fetchReviewQueue("pending")
      .then((data) => {
        setQueue(data);
        if (data.length > 0) {
          setActivePairId(data[0].pair_id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoadingQueue(false));
  }, []);

  // Load pair detail when active pair changes
  useEffect(() => {
    if (!activePairId) {
      setPairDetail(null);
      return;
    }
    setIsLoadingPair(true);
    setError(null);
    fetchReviewPair(activePairId)
      .then(setPairDetail)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoadingPair(false));
  }, [activePairId]);

  const handleDecide = useCallback(
    async (decision: Decision) => {
      if (!activePairId || !pairDetail || isSubmitting) return;
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await submitDecision(activePairId, {
          decision,
          reviewer_id: REVIEWER_ID,
        });

        // Update queue status locally
        setQueue((prev) =>
          prev.map((item) =>
            item.pair_id === activePairId
              ? {
                  ...item,
                  status:
                    decision === "merge"
                      ? "merged"
                      : decision === "separate"
                      ? "separated"
                      : "escalated",
                  reviewer_id: REVIEWER_ID,
                  decided_at: new Date().toISOString(),
                }
              : item
          )
        );

        // Add to activity log
        const entry: ActivityEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          decision,
          pair_id: activePairId,
          record_a_name: pairDetail.record_a?.biz_name_raw ?? pairDetail.pair.record_a_id,
          record_b_name: pairDetail.record_b?.biz_name_raw ?? pairDetail.pair.record_b_id,
          ubid: result.ubid,
        };
        setActivityLog((prev) => [...prev, entry]);

        // Auto-advance to next pending pair
        const remaining = queue.filter(
          (p) => p.pair_id !== activePairId && p.status === "pending"
        );
        if (remaining.length > 0) {
          setActivePairId(remaining[0].pair_id);
        } else {
          setActivePairId(null);
          setPairDetail(null);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Submission failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [activePairId, pairDetail, isSubmitting, queue]
  );

  const handleUndo = useCallback((entryId: string) => {
    setActivityLog((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, undone: true } : e))
    );
    // In a real app, this would call a PATCH /api/review-queue/{pair_id}/undo
  }, []);

  const pendingCount = queue.filter((p) => p.status === "pending").length;

  return (
    <div className="flex flex-col h-full">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-950 border-b border-red-800 text-red-300 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <QueueSidebar
          queue={queue}
          activePairId={activePairId}
          onSelect={setActivePairId}
        />

        {/* Center panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoadingQueue || isLoadingPair ? (
            <LoadingState />
          ) : !pairDetail ? (
            <EmptyState pendingCount={pendingCount} />
          ) : (
            <>
              <ScoreHeader pair={pairDetail.pair} />
              {pairDetail.record_a && pairDetail.record_b ? (
                <ComparisonTable
                  recordA={pairDetail.record_a}
                  recordB={pairDetail.record_b}
                />
              ) : (
                <MissingRecordsState pair={pairDetail.pair} />
              )}
            </>
          )}

          {/* Action bar — always visible */}
          <ActionBar
            onDecide={handleDecide}
            isLoading={isSubmitting}
            disabled={!pairDetail || pairDetail.pair.status !== "pending"}
          />
        </div>
      </div>

      {/* Activity log */}
      <ActivityLog entries={activityLog} onUndo={handleUndo} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-zinc-600">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        <span className="text-[11px] uppercase tracking-widest">Loading…</span>
      </div>
    </div>
  );
}

function EmptyState({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-600">
        <Inbox className="w-8 h-8 text-zinc-700" />
        {pendingCount === 0 ? (
          <>
            <span className="text-[13px] font-semibold text-zinc-400">
              Queue cleared
            </span>
            <span className="text-[11px] text-zinc-600">
              All pairs have been reviewed.
            </span>
          </>
        ) : (
          <>
            <span className="text-[13px] font-semibold text-zinc-400">
              Select a pair
            </span>
            <span className="text-[11px] text-zinc-600">
              Choose a pair from the queue to begin review.
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function MissingRecordsState({ pair }: { pair: import("@/lib/types").ReviewQueueItem }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-600">
        <AlertCircle className="w-8 h-8 text-yellow-700" />
        <span className="text-[13px] font-semibold text-zinc-400">
          Records not in canonical table
        </span>
        <span className="text-[11px] text-zinc-600 text-center max-w-xs">
          Pair <span className="font-mono text-zinc-400">{pair.pair_id}</span> references records that
          haven&apos;t been loaded into the canonical table yet.
          <br />
          Run <span className="font-mono text-zinc-400">populate_canonical.py</span> to fix this.
        </span>
        <div className="flex gap-4 text-[11px] font-mono mt-1">
          <span className="text-zinc-500">{pair.record_a_id}</span>
          <span className="text-zinc-700">↔</span>
          <span className="text-zinc-500">{pair.record_b_id}</span>
        </div>
      </div>
    </div>
  );
}
