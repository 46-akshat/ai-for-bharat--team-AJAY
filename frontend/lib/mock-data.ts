import type { ReviewQueueItem, CanonicalRecord, ReviewPairDetail } from "./types";

// ─── Mock Canonical Records ────────────────────────────────────────────────────

export const MOCK_RECORDS: Record<string, CanonicalRecord> = {
  "FAC_a1b2c3": {
    raw_id: "FAC_a1b2c3",
    source_dept: "factories",
    biz_name_raw: "Sri Venkateshwara Steel Works Pvt Ltd",
    biz_name_norm: "sri venkateshwara steel works pvt ltd",
    address_raw: "Plot No. 14, KIADB Industrial Area, Bommasandra, Bengaluru - 560099",
    pin: "560099",
    pan: "AABCS1234F",
    gst: "29AABCS1234F1Z5",
    phone: "9845012345",
    created_at: "2024-01-15T10:30:00Z",
  },
  "SHP_d4e5f6": {
    raw_id: "SHP_d4e5f6",
    source_dept: "shops",
    biz_name_raw: "Venkateshwara Steel Works",
    biz_name_norm: "venkateshwara steel works",
    address_raw: "14, KIADB Indl Area, Bommasandra, Bangalore 560099",
    pin: "560099",
    pan: "AABCS1234F",
    gst: "29AABCS1234F1Z5",
    phone: "9845012345",
    created_at: "2024-01-16T08:15:00Z",
  },
  "BES_g7h8i9": {
    raw_id: "BES_g7h8i9",
    source_dept: "bescom",
    biz_name_raw: "Lakshmi Textiles & Garments",
    biz_name_norm: "lakshmi textiles garments",
    address_raw: "No. 22, 3rd Cross, Rajajinagar Industrial Estate, Bengaluru - 560044",
    pin: "560044",
    pan: "BCDLT5678G",
    gst: "29BCDLT5678G1Z3",
    phone: "8022334455",
    created_at: "2024-01-17T09:00:00Z",
  },
  "FAC_j1k2l3": {
    raw_id: "FAC_j1k2l3",
    source_dept: "factories",
    biz_name_raw: "Laxmi Textile and Garment Mfg",
    biz_name_norm: "laxmi textile garment mfg",
    address_raw: "22, 3rd Cross, Rajajinagar Indl Estate, Bangalore 560044",
    pin: "560044",
    pan: "BCDLT5678G",
    gst: "29BCDLT5678H1Z3",
    phone: "8022334456",
    created_at: "2024-01-17T11:30:00Z",
  },
  "SHP_m4n5o6": {
    raw_id: "SHP_m4n5o6",
    source_dept: "shops",
    biz_name_raw: "Nandi Agro Foods Processing Unit",
    biz_name_norm: "nandi agro foods processing unit",
    address_raw: "Survey No. 45/2, Hoskote Road, Whitefield, Bengaluru - 560066",
    pin: "560066",
    pan: "CEFNA9012H",
    gst: "29CEFNA9012H1Z1",
    phone: "7760123456",
    created_at: "2024-01-18T14:00:00Z",
  },
  "BES_p7q8r9": {
    raw_id: "BES_p7q8r9",
    source_dept: "bescom",
    biz_name_raw: "Nandi Agro Food Processing",
    biz_name_norm: "nandi agro food processing",
    address_raw: "Sy No 45/2, Hoskote Rd, Whitefield, Bangalore 560066",
    pin: "560066",
    pan: "CEFNA9012H",
    gst: "29CEFNA9012H1Z1",
    phone: "7760123457",
    created_at: "2024-01-18T15:45:00Z",
  },
};

// ─── Mock Review Queue ─────────────────────────────────────────────────────────

export const MOCK_QUEUE: ReviewQueueItem[] = [
  {
    pair_id: "PAIR_001",
    record_a_id: "FAC_a1b2c3",
    record_b_id: "SHP_d4e5f6",
    splink_score: 0.87,
    bayes_factors: {
      pan: 12.4,
      gst: 11.8,
      biz_name_norm: 6.2,
      address_norm: 4.1,
      pin: 3.8,
      phone: 8.9,
    },
    status: "pending",
    reviewer_id: null,
    decided_at: null,
  },
  {
    pair_id: "PAIR_002",
    record_a_id: "BES_g7h8i9",
    record_b_id: "FAC_j1k2l3",
    splink_score: 0.71,
    bayes_factors: {
      pan: 12.4,
      gst: 2.1,
      biz_name_norm: 5.8,
      address_norm: 5.2,
      pin: 3.8,
      phone: 0.9,
    },
    status: "pending",
    reviewer_id: null,
    decided_at: null,
  },
  {
    pair_id: "PAIR_003",
    record_a_id: "SHP_m4n5o6",
    record_b_id: "BES_p7q8r9",
    splink_score: 0.63,
    bayes_factors: {
      pan: 12.4,
      gst: 12.4,
      biz_name_norm: 4.9,
      address_norm: 4.7,
      pin: 3.8,
      phone: 0.8,
    },
    status: "pending",
    reviewer_id: null,
    decided_at: null,
  },
];

// ─── Mock Pair Detail Builder ──────────────────────────────────────────────────

export function getMockPairDetail(pairId: string): ReviewPairDetail | null {
  const pair = MOCK_QUEUE.find((p) => p.pair_id === pairId);
  if (!pair) return null;
  const record_a = MOCK_RECORDS[pair.record_a_id];
  const record_b = MOCK_RECORDS[pair.record_b_id];
  if (!record_a || !record_b) return null;
  return { pair, record_a, record_b };
}
