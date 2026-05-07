"use client";

import { useState, useEffect } from "react";
import { RegistrySidebar } from "./RegistrySidebar";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { IntelligenceActionBar } from "./IntelligenceActionBar";
import { ActivityLog } from "./ActivityLog";
import type { ActivityEntry } from "@/lib/types";

// Types
type Business = { ubid: string; status: "active" | "dormant" | "closed" };
type Event = { event_id: string; event_type: string; signal_weight: string; source_dept: string; occurred_at: string };

export function IntelligenceDashboard({ initialUbid }: { initialUbid?: string | null }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedUbid, setSelectedUbid] = useState<string | null>(initialUbid || null);
  const [timeline, setTimeline] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  // Fetch Businesses from your FastAPI Backend
  useEffect(() => {
    fetch('http://localhost:8000/api/ubids/status')
      .then(res => res.json())
      .then(data => {
        setBusinesses(data);
        setIsLoading(false);
      })
      .catch(err => console.error("API Error:", err));
  }, []);

  // Fetch Timeline when UBID is selected
  useEffect(() => {
    if (!selectedUbid) {
      setTimeline([]);
      return;
    }
    fetch(`http://localhost:8000/api/events?ubid=${selectedUbid}`)
      .then(res => res.json())
      .then(data => setTimeline(data))
      .catch(err => console.error("API Error:", err));
  }, [selectedUbid]);

  const handleAction = (action: string) => {
    // Implement action handling logic here (e.g., flag, acknowledge)
    console.log(`Action triggered: ${action} for UBID: ${selectedUbid}`);
  };

  const handleUndo = (entryId: string) => {
    setActivityLog((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, undone: true } : e))
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <RegistrySidebar 
          businesses={businesses}
          activeUbid={selectedUbid}
          onSelect={setSelectedUbid}
          isLoading={isLoading}
        />

        {/* Center panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EvidenceTimeline 
            selectedUbid={selectedUbid}
            timeline={timeline}
          />

          {/* Action bar */}
          <IntelligenceActionBar 
            onAction={handleAction}
            disabled={!selectedUbid}
          />
        </div>
      </div>

      {/* Activity log */}
      <ActivityLog entries={activityLog} onUndo={handleUndo} />
    </div>
  );
}
