# KA-UBID — Karnataka Unified Business ID

A full-stack prototype for **government business record deduplication**. It ingests raw business data from three Karnataka government sources — Shops & Establishments, Factories, and BESCOM (electricity utility) — runs them through a multi-stage ML pipeline to detect duplicate entities, and assigns each unique real-world business a canonical **UBID** (`KA-UBID-00001`).

Ambiguous matches (Splink score 50–89%) are routed to a human reviewer via a purpose-built internal dashboard.

---

## Demo

https://youtu.be/8u-ZosUvJp4?si=nComwIfAupkcwDyz


> Dark, data-dense reviewer UI — side-by-side record comparison with field-level diff highlighting, Bayes factor breakdown, and keyboard-driven decisions.

---

## Architecture

```
Raw CSVs (shops / factories / bescom)
        │
        ▼
  1. generator.py       — Synthetic Indian business data (Faker)
        │
        ▼
  2. normalize.py       — Text cleaning, biz_name_norm, DuckDB → Parquet
        │
        ▼
  3. candidate_pairer.py — C++ Trie blocking on PAN / GST / PIN prefixes
        │
        ▼
  4. scoring.py         — Splink EM algorithm (probabilistic record linkage)
        │
        ▼
  5. decision.py        — Confidence routing:
                            ≥ 90%  → Auto-link  (UBID assigned)
                            50–89% → Review Queue (human decision)
                            < 50%  → Rejected
        │
        ▼
  6. populate_canonical.py — Merge sources → canonical_record table
        │
        ▼
  7. loader.py          — Upload normalized records to Supabase
```

```
┌─────────────────────────────────┐
│     Next.js 16 Frontend         │  ← Review Dashboard (this repo)
│     Tailwind CSS + TypeScript   │
└────────────────┬────────────────┘
                 │ REST
┌────────────────▼────────────────┐
│     FastAPI Backend             │
│     SQLAlchemy ORM              │
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│     Supabase PostgreSQL         │
│     (7 tables)                  │
└─────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| Database | Supabase (PostgreSQL) |
| ML / Matching | [Splink](https://github.com/moj-analytical-services/splink) 4.x (EM algorithm) |
| Candidate Generation | C++ Trie (compiled via pybind11), DuckDB |
| Data Processing | Pandas, PyArrow, DuckDB |
| Synthetic Data | Faker (Indian locale) |

---

## Database Schema

| Table | Purpose |
|---|---|
| `canonical_record` | Unified normalized view of all records (`raw_id` PK) |
| `shops` | Raw shop & establishment records |
| `factories` | Raw factory records |
| `bescom` | Raw BESCOM electricity records |
| `ubid_registry` | Master UBID registry (`KA-UBID-XXXXX`) |
| `record_ubid_linkage` | Junction: records → UBID, with match score & method |
| `review_queue` | Ambiguous pairs awaiting human decision |
| `event` | Audit trail of UBID lifecycle events |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/records` | All canonical records |
| `GET` | `/api/shops` | Raw shop records |
| `GET` | `/api/factories` | Raw factory records |
| `GET` | `/api/bescom` | Raw BESCOM records |
| `GET` | `/api/review-queue?status=pending` | Pending review pairs |
| `GET` | `/api/review-queue/{pair_id}` | Single pair with both records |
| `POST` | `/api/review-queue/{pair_id}/decide` | Submit `merge / separate / escalate` |
| `GET` | `/api/ubids` | All assigned UBIDs |
| `DELETE` | `/api/cleanup` | Wipe all pipeline data |

---

## Project Structure

```
aifb-prototype/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app, all endpoints
│       ├── models.py        # SQLAlchemy ORM models
│       ├── database.py      # Supabase connection
│       └── query_engine.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Root page
│   │   ├── layout.tsx       # App shell
│   │   └── globals.css      # Dark theme
│   ├── components/
│   │   ├── ReviewDashboard.tsx   # Main orchestrator
│   │   ├── PipelineStepper.tsx   # 5-step pipeline progress
│   │   ├── QueueSidebar.tsx      # Pending pairs list
│   │   ├── ScoreHeader.tsx       # Splink score + Bayes factors
│   │   ├── ComparisonTable.tsx   # Side-by-side field diff
│   │   ├── ActionBar.tsx         # Merge / Separate / Escalate
│   │   └── ActivityLog.tsx       # Decision history + Undo
│   └── lib/
│       ├── types.ts         # TypeScript interfaces
│       ├── api.ts           # API layer (mock toggle)
│       ├── utils.ts         # Helpers, color coding
│       └── mock-data.ts     # Local dev mock data
├── pipeline/
│   ├── generator.py         # Synthetic data generation
│   ├── normalize.py         # Text normalization → Parquet
│   ├── candidate_pairer.py  # C++ Trie candidate generation
│   ├── scoring.py           # Splink probabilistic scoring
│   ├── decision.py          # Confidence routing → DB
│   ├── populate_canonical.py # Merge sources → canonical table
│   ├── loader.py            # Upload to Supabase
│   └── cpp_matcher/         # C++ Trie source + DuckDB bindings
├── data/                    # Parquet + CSV pipeline outputs
├── .env                     # DATABASE_URL (not committed)
├── requirements.txt
└── schema.md                # Canonical DB schema contract
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema applied

### 1. Clone & configure

```bash
git clone https://github.com/your-org/aifb-prototype.git
cd aifb-prototype
```

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

### 2. Backend setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server (from aifb-prototype/)
uvicorn backend.app.main:app --reload
```

API docs available at `http://127.0.0.1:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### 4. Run the pipeline

Run these scripts in order from `aifb-prototype/` with your venv active:

```bash
# Generate synthetic data
python pipeline/generator.py

# Normalize and export to Parquet
python pipeline/normalize.py

# Generate candidate pairs (requires C++ compiler)
python pipeline/candidate_pairer.py

# Score pairs with Splink
python pipeline/scoring.py

# Route decisions → DB
python pipeline/decision.py

# Upload normalized records to Supabase
python pipeline/loader.py

# Populate the canonical_record table
python pipeline/populate_canonical.py
```

After the pipeline completes, the review dashboard will show all pending pairs.

---

## Review Dashboard Features

- **Pipeline Stepper** — visual 5-step progress bar showing where data came from
- **Queue Sidebar** — all pending/resolved pairs with Splink scores, color-coded by confidence
- **Side-by-side Comparison** — field-level diff with green (match) / red (mismatch) row highlighting and character-level diff for short fields (PAN, GST, PIN)
- **Bayes Factor Breakdown** — per-field evidence weights from Splink
- **Action Bar** — `Merge`, `Separate`, `Escalate` buttons with keyboard shortcuts (`M` / `S` / `E`)
- **Activity Log** — timestamped decision history with `Undo` for recent actions
- **Auto-advance** — automatically loads the next pending pair after each decision

---

## Confidence Routing

| Score | Action | Result |
|---|---|---|
| ≥ 90% | Auto-link | UBID assigned automatically via connected-component graph |
| 50–89% | Human Review | Pair inserted into `review_queue` |
| < 50% | Rejected | Discarded |

---

## Development Notes

**Mock mode** — set `USE_MOCK = true` in `frontend/lib/api.ts` to run the frontend without a backend using local fixture data.

**CORS** — the backend allows `localhost:3000` by default. To add other origins, update `allow_origins` in `backend/app/main.py`.

**Raw ID format** — pipeline-generated IDs follow the pattern `{PREFIX}_{6-char hex}` where prefix is `SHP`, `FAC`, or `BES`.

**UBID format** — `KA-UBID-XXXXX` (zero-padded 5-digit sequential, Karnataka-scoped).

---

## License

MIT
