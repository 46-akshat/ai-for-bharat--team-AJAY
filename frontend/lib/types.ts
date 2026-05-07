// ─── Core API Types ────────────────────────────────────────────────────────────

export interface CanonicalRecord {
  raw_id: string;
  source_dept: "shops" | "factories" | "bescom";
  biz_name_raw: string;
  biz_name_norm: string;
  address_raw: string;
  pin: string;
  pan: string;
  gst: string;
  phone: string;
  created_at: string;
}

export interface ReviewQueueItem {
  pair_id: string;
  record_a_id: string;
  record_b_id: string;
  splink_score: number;
  bayes_factors: Record<string, number> | null;
  status: "pending" | "merged" | "separated" | "escalated";
  reviewer_id: string | null;
  decided_at: string | null;
}

export interface ReviewPairDetail {
  pair: ReviewQueueItem;
  record_a: CanonicalRecord | null;
  record_b: CanonicalRecord | null;
}

export interface UBIDRegistry {
  ubid: string;
  created_at: string;
  status: "active" | "dormant" | "closed";
  confidence_score: number;
  last_updated: string | null;
}

export type Decision = "merge" | "separate" | "escalate";

export interface DecisionPayload {
  decision: Decision;
  reviewer_id: string;
}

export interface DecisionResponse {
  message: string;
  ubid: string | null;
}

// ─── Part B Types ─────────────────────────────────────────────────────────────

export interface BusinessEvent {
  event_id: string;
  ubid: string;
  event_type: string;
  signal_weight: "HIGH" | "MED" | "LOW" | "CLOSURE";
  source_dept: string;
  occurred_at: string;
}

export interface UBIDStatus {
  ubid: string;
  status: "active" | "dormant" | "closed";
  confidence_score: number;
  created_at: string;
  last_updated: string | null;
}

export interface InactiveResult {
  threshold_days: number;
  inactive_count: number;
  ubids: UBIDStatus[];
}

// ─── Activity Log ──────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  timestamp: string;
  decision: Decision;
  pair_id: string;
  record_a_name: string;
  record_b_name: string;
  ubid: string | null;
  undone?: boolean;
}

// ─── Pipeline Steps ────────────────────────────────────────────────────────────

export type PipelineStepStatus = "done" | "active" | "pending";

export interface PipelineStep {
  id: number;
  label: string;
  sublabel: string;
  status: PipelineStepStatus;
}
