import type {
  ReviewQueueItem,
  ReviewPairDetail,
  DecisionPayload,
  DecisionResponse,
  UBIDRegistry,
  CanonicalRecord,
} from "./types";
import {
  MOCK_QUEUE,
  getMockPairDetail,
} from "./mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ─── Toggle: set USE_MOCK=false to hit the real FastAPI backend ───────────────
const USE_MOCK = false;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Review Queue ──────────────────────────────────────────────────────────────

export async function fetchReviewQueue(
  status = "pending"
): Promise<ReviewQueueItem[]> {
  if (USE_MOCK) return MOCK_QUEUE.filter((p) => p.status === status);
  return apiFetch<ReviewQueueItem[]>(`/api/review-queue?status=${status}`);
}

export async function fetchReviewPair(
  pairId: string
): Promise<ReviewPairDetail> {
  if (USE_MOCK) {
    const detail = getMockPairDetail(pairId);
    if (!detail) throw new Error(`Pair ${pairId} not found`);
    return detail;
  }
  return apiFetch<ReviewPairDetail>(`/api/review-queue/${pairId}`);
}

export async function submitDecision(
  pairId: string,
  payload: DecisionPayload
): Promise<DecisionResponse> {
  if (USE_MOCK) {
    const ubid =
      payload.decision === "merge"
        ? `KA-UBID-${String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0")}`
        : null;
    return {
      message: `Pair marked as ${payload.decision}d`,
      ubid,
    };
  }
  return apiFetch<DecisionResponse>(`/api/review-queue/${pairId}/decide`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── UBIDs ────────────────────────────────────────────────────────────────────

export async function fetchUBIDs(limit = 100): Promise<UBIDRegistry[]> {
  if (USE_MOCK) return [];
  return apiFetch<UBIDRegistry[]>(`/api/ubids?limit=${limit}`);
}

// ─── Records ──────────────────────────────────────────────────────────────────

export async function fetchRecords(limit = 100): Promise<CanonicalRecord[]> {
  if (USE_MOCK) return [];
  return apiFetch<CanonicalRecord[]>(`/api/records?limit=${limit}`);
}

// ─── Pipeline Orchestration ──────────────────────────────────────────────────

export async function runPipelineGenerate(): Promise<any> {
  return apiFetch<any>(`/api/pipeline/generate`, { method: "POST" });
}

export async function runPipelineNormalize(): Promise<any> {
  return apiFetch<any>(`/api/pipeline/normalize`, { method: "POST" });
}

export async function runPipelinePair(): Promise<any> {
  return apiFetch<any>(`/api/pipeline/pair`, { method: "POST" });
}

export async function runPipelineScore(): Promise<any> {
  return apiFetch<any>(`/api/pipeline/score`, { method: "POST" });
}

export async function runPipelineDecision(): Promise<any> {
  return apiFetch<any>(`/api/pipeline/decision`, { method: "POST" });
}

export async function wipeDatabase(): Promise<any> {
  return apiFetch<any>(`/api/cleanup`, { method: "DELETE" });
}
