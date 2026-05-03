# AI For Bharat - Database Schema Contract

This file contains the canonical data structures for the 5-day prototype sprint. All backend, frontend, and data pipeline code must conform strictly to these field names and types.

## 1. Core Architecture Diagram
*Copy this block and paste it into [PlantText](https://www.planttext.com/) to view the visual ERD.*
```@startuml
' Visual styling for a clean, modern look
hide circle
skinparam linetype ortho
skinparam EntityBackgroundColor #F9F9F9
skinparam EntityBorderColor #333333

' --- Tables ---

entity "Canonical_Record" as canonical {
  *raw_id : VARCHAR [PK]
  --
  *source_dept : VARCHAR
  biz_name_raw : VARCHAR
  biz_name_norm : VARCHAR
  address_raw : TEXT
  pin : VARCHAR
  pan : VARCHAR
  gst : VARCHAR
  phone : VARCHAR
  *created_at : TIMESTAMP
}

entity "UBID_Registry" as ubid_reg {
  *ubid : VARCHAR [PK]
  --
  *created_at : TIMESTAMP
  *status : VARCHAR (active/dormant/closed)
  confidence_score : FLOAT
  last_updated : TIMESTAMP
}

entity "Record_UBID_Linkage" as linkage {
  *ubid : VARCHAR [FK]
  *raw_id : VARCHAR [FK]
  --
  source_dept : VARCHAR
  match_score : FLOAT
  link_method : VARCHAR (auto/human)
  reviewer_id : VARCHAR
  linked_at : TIMESTAMP
}

entity "Review_Queue" as review {
  *pair_id : VARCHAR [PK]
  --
  *record_a_id : VARCHAR [FK]
  *record_b_id : VARCHAR [FK]
  splink_score : FLOAT
  bayes_factors : JSON
  *status : VARCHAR (pending/merged/separated/escalated)
  reviewer_id : VARCHAR
  decided_at : TIMESTAMP
}

entity "Event" as event {
  *event_id : VARCHAR [PK]
  --
  *ubid : VARCHAR [FK]
  event_type : VARCHAR
  signal_weight : VARCHAR (HIGH/MED/LOW)
  source_dept : VARCHAR
  occurred_at : TIMESTAMP
}

' --- Relationships (with explicit Cardinality Mapping) ---

' 1 to Many: A Canonical Record can be evaluated in multiple review pairs
canonical "1" ||--o{ "0..*" review : "1 to Many (as record A)"
canonical "1" ||--o{ "0..*" review : "1 to Many (as record B)"

' 1 to 1: A Canonical Record gets linked to exactly one UBID record in the linkage table
canonical "1" ||--o| "0..1" linkage : "1 to 1 (raw_id)"

' 1 to Many: A single UBID in the registry links to multiple raw records
ubid_reg "1" ||--o{ "1..*" linkage : "1 to Many (ubid)"

' 1 to Many: A single UBID has an evidence timeline of multiple events
ubid_reg "1" ||--o{ "0..*" event : "1 to Many (ubid)"

@enduml