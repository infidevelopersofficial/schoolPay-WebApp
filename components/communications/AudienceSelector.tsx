"use client";

import { useState, useEffect } from "react";
import { getClassesAction, getBatchesAction } from "@/app/(dashboard)/dashboard/communications/actions";

interface AudienceSelectorProps {
  value: any;
  onChange: (value: any) => void;
}

export function AudienceSelector({ value, onChange }: AudienceSelectorProps) {
  const [classes, setClasses] = useState<string[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const targetType = value?.type || "ALL_STUDENTS";
  const selectedClasses = value?.classes || [];
  const selectedBatches = value?.batches || [];

  useEffect(() => {
    async function load() {
      try {
        const [cls, bts] = await Promise.all([
          getClassesAction(),
          getBatchesAction()
        ]);
        setClasses(cls);
        setBatches(bts);
      } catch (e) {
        console.error("Failed to load audience targets", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleTypeChange = (type: string) => {
    onChange({ type, classes: [], batches: [] });
  };

  const toggleClass = (cls: string) => {
    const newClasses = selectedClasses.includes(cls)
      ? selectedClasses.filter((c: string) => c !== cls)
      : [...selectedClasses, cls];
    onChange({ ...value, classes: newClasses });
  };

  const toggleBatch = (batchId: string) => {
    const newBatches = selectedBatches.includes(batchId)
      ? selectedBatches.filter((b: string) => b !== batchId)
      : [...selectedBatches, batchId];
    onChange({ ...value, batches: newBatches });
  };

  if (loading) {
    return <div className="p-4 text-white/50 text-sm">Loading audience targets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70">Target Audience</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: "ALL_STUDENTS", label: "All Students", desc: "Send to everyone" },
            { id: "SPECIFIC_CLASSES", label: "Specific Classes", desc: "Target by grade/class" },
            { id: "SPECIFIC_BATCHES", label: "Specific Batches", desc: "Target custom groups" },
            { id: "DEFAULTERS", label: "Fee Defaulters", desc: "Students with pending dues" },
          ].map((type) => (
            <div
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                targetType === type.id
                  ? "bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className={`font-semibold text-sm ${targetType === type.id ? "text-indigo-300" : "text-white"}`}>
                {type.label}
              </div>
              <div className="text-xs text-white/50 mt-1">{type.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {targetType === "SPECIFIC_CLASSES" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-sm font-medium text-white/70">Select Classes</label>
          {classes.length === 0 ? (
            <div className="text-sm text-white/40">No classes found.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => toggleClass(cls)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    selectedClasses.includes(cls)
                      ? "bg-indigo-500/30 border-indigo-500 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {targetType === "SPECIFIC_BATCHES" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-sm font-medium text-white/70">Select Batches</label>
          {batches.length === 0 ? (
            <div className="text-sm text-white/40">No batches found.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => toggleBatch(batch.id)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    selectedBatches.includes(batch.id)
                      ? "bg-indigo-500/30 border-indigo-500 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {batch.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
