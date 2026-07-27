"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const activityOptions = ["Basketball", "Study", "Gaming", "Coffee", "Volleyball", "Soccer", "Swimming", "LeetCode", "Hike", "Board Games", "Open Mic"];
const zoneOptions = ["PAC", "DC", "SLC", "EV3", "MC", "Columbia Fields", "Laurel Creek"];
const ease = [0.25, 0.46, 0.45, 0.94] as const;

interface Props { open: boolean; onClose: () => void; onCreated?: () => void; }

export default function CreateBubbleModal({ open, onClose, onCreated }: Props) {
  const [smartInput, setSmartInput] = useState("");
  const [activity, setActivity] = useState("");
  const [zone, setZone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [description, setDescription] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleParseIntent = async () => {
    const text = smartInput.trim();
    if (!text) { toast.error("Type something first (e.g. coffee near SLC at 7pm)"); return; }
    setParsing(true);
    try {
      const res = await fetch("/api/ai/parse-intent", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error ?? "Could not parse"); return; }
      const d = data.data;
      if (d.activity) setActivity(d.activity);
      if (d.zone) setZone(d.zone);
      if (d.start_time) {
        const date = new Date(d.start_time);
        if (!isNaN(date.getTime())) {
          const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"),
            day = String(date.getDate()).padStart(2, "0"), h = String(date.getHours()).padStart(2, "0"),
            min = String(date.getMinutes()).padStart(2, "0");
          setStartTime(`${y}-${m}-${day}T${h}:${min}`);
        }
      }
      if (d.duration_minutes) setDurationMinutes(String(d.duration_minutes));
      if (d.max_members) setMaxMembers(String(d.max_members));
      if (d.description) setDescription(d.description);
      toast.success("Form filled from your message ✨");
    } catch { toast.error("Parse failed"); }
    finally { setParsing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim() || !zone.trim() || !startTime || !durationMinutes) {
      toast.error("Activity, zone, start time and duration are required"); return;
    }
    const start = new Date(startTime);
    if (isNaN(start.getTime()) || start < new Date()) {
      toast.error("Start time must be in the future"); return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { toast.error("Sign in to create a bubble"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          activity: activity.trim(), zone: zone.trim(),
          start_time: start.toISOString(), duration_minutes: Number(durationMinutes) || 60,
          max_members: maxMembers ? Number(maxMembers) : undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error ?? "Failed to create bubble"); return; }
      toast.success("Bubble created! 🫧");
      onClose(); onCreated?.();
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: "rgba(12,12,14,0.97)",
              border: "1px solid rgba(255,122,26,0.15)",
              backdropFilter: "blur(24px)",
              boxShadow: "inset 0 1px 0 rgba(255,122,26,0.1), 0 -32px 80px rgba(0,0,0,0.8)",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient glow top */}
            <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
              style={{ background: "linear-gradient(90deg, #ff7a1a, #ffb56b, #ff7a1a)" }} />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Start Something
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    What's happening on campus?
                  </p>
                </div>
                <motion.button type="button" onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" }}
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* AI smart input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: "var(--color-text-muted)" }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#ff7a1a" }} />
                    Describe it naturally
                  </label>
                  <div className="flex gap-2">
                    <WarmInput
                      placeholder="e.g. coffee near SLC at 7pm"
                      value={smartInput}
                      onChange={e => setSmartInput(e.target.value)}
                      className="flex-1"
                    />
                    <motion.button type="button" onClick={handleParseIntent} disabled={parsing}
                      className="px-4 h-11 rounded-xl text-xs font-bold shrink-0"
                      style={{
                        background: "rgba(255,122,26,0.15)",
                        border: "1px solid rgba(255,122,26,0.25)",
                        color: "var(--color-text-primary)",
                        opacity: parsing ? 0.6 : 1,
                      }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      {parsing ? "…" : "Fill form"}
                    </motion.button>
                  </div>
                </div>

                {/* Activity chips */}
                <FieldGroup label="Activity">
                  <ChipGrid options={activityOptions} selected={activity} onSelect={v => setActivity(activity === v ? "" : v)} />
                  <WarmInput placeholder="Or type custom activity" value={activity}
                    onChange={e => setActivity(e.target.value)} className="mt-2" />
                </FieldGroup>

                {/* Zone chips */}
                <FieldGroup label="Zone">
                  <ChipGrid options={zoneOptions} selected={zone} onSelect={v => setZone(zone === v ? "" : v)} />
                  <WarmInput placeholder="Or type zone" value={zone}
                    onChange={e => setZone(e.target.value)} className="mt-2" />
                </FieldGroup>

                {/* Time + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Start Time">
                    <WarmInput type="datetime-local" value={startTime}
                      onChange={e => setStartTime(e.target.value)} required />
                  </FieldGroup>
                  <FieldGroup label="Duration (min)">
                    <WarmInput type="number" placeholder="60" min="15" max="480"
                      value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} required />
                  </FieldGroup>
                </div>

                {/* Max members */}
                <FieldGroup label="Max Members (optional)">
                  <WarmInput type="number" placeholder="6" min="2" max="50"
                    value={maxMembers} onChange={e => setMaxMembers(e.target.value)} />
                </FieldGroup>

                {/* Description */}
                <FieldGroup label="Description">
                  <textarea
                    placeholder="What's the plan?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--color-text-primary)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(255,122,26,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </FieldGroup>

                {/* Submit */}
                <motion.button type="submit" disabled={submitting}
                  className="w-full h-12 rounded-full font-bold text-base"
                  style={{
                    background: "linear-gradient(135deg, #ff7a1a 0%, #ffb56b 100%)",
                    color: "#2a1206",
                    boxShadow: "0 0 32px rgba(255,122,26,0.35)",
                    opacity: submitting ? 0.7 : 1,
                  }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 48px rgba(255,122,26,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  {submitting ? "Creating…" : "Create Bubble 🫧"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WarmInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={`h-11 px-3 rounded-xl text-sm outline-none w-full ${className}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "var(--color-text-primary)",
        ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = "rgba(255,122,26,0.4)"; props.onFocus?.(e); }}
      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; props.onBlur?.(e); }}
    />
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipGrid({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <motion.button key={opt} type="button" onClick={() => onSelect(opt)}
          className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={selected === opt ? {
            background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
            color: "#2a1206", fontWeight: 700, border: "none",
          } : {
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--color-text-secondary)",
          }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
