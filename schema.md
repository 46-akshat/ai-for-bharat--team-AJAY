# AI For Bharat - Database Schema Contract

This file contains the canonical data structures for the 5-day prototype sprint. All backend, frontend, and data pipeline code must conform strictly to these field names and types.

## 1. Core Architecture Diagram
*Copy this block and paste it into [PlantText](https://www.planttext.com/) to view the visual ERD.*
```plantuml
@startuml
hide circle
skinparam linetype ortho

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

canonical "1" ||--o{ "0..*" review : "record_a_id / record_b_id"
canonical "1" ||--o| "0..1" linkage : "raw_id"
ubid_reg "1" ||--o{ "1..*" linkage : "ubid"
ubid_reg "1" ||--o{ "0..*" event : "ubid"
@enduml