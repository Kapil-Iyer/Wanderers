"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Flame, Pencil, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { deriveEmoji, humanStartingIn, type ApiBubble } from "@/lib/bubbleMap";

const activityOptions = ["Basketball", "Study", "Gaming", "Coffee", "Volleyball", "Soccer", "Swimming", "LeetCode", "Hike", "Board Games", "Open Mic"];
const zoneOptions = ["PAC", "DC", "SLC", "EV3", "MC", "Columbia Fields", "Laurel Creek"];
const ease = [0.25, 0.46, 0.45, 0.94] as const;

const AMBER_TOAST = {
  background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
  color: "#1a0a00",
  border: "none",
  fontWeight: 600,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (bubble?: ApiBubble) => void;
  /** Pre-fill activity/zone when opening (e.g. "Start a bubble for this" from a campus event). */
  prefill?: { activity?: string; zone?: string };
}

type View = "form" | "confirm";

export default function CreateBubbleModal({ open, onClose, onCreated, prefill }: Props) {
  const [view, setView] = useState<View>("form");
  const [smartInput, setSmartInput] = useState("");
  const [activity, setActivity] = useState("");
  const [zone, setZone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [description, setDescription] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setView("form");
    setSmartInput(""); setActivity(""); setZone(""); setStartTime("");
    setDurationMinutes(""); setMaxMembers(""); setDescription("");
    setParsing(false); setParseError(null); setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // Apply prefill (from "Start a bubble for this") each time the modal opens.
  const prefillActivity = prefill?.activity;
  const prefillZone = prefill?.zone;
  useEffect(() => {
    if (open && (prefillActivity || prefillZone)) {
      setView("form");
      if (prefillActivity) setActivity(prefillActivity);
      if (prefillZone) setZone(prefillZone);
    }
  }, [open, prefillActivity, prefillZone]);

  // Natural language → parse → confirmation card. Errors surface inline (the
  // manual form fields stay visible), never as a hard failure.
  const handleParseIntent = async () => {
    const text = smartInput.trim();
    if (!text) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch("/api/ai/parse-intent", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setParseError(data.error ?? "Slow down - you're parsing too fast");
        return;
      }
      if (!data.success) {
        setParseError(data.error ?? "Couldn't parse that - try the manual form.");
        return;
      }

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

      // Need at least an activity to confirm; otherwise leave the form for them
      if (d.activity) setView("confirm");
      else setParseError("Add a bit more detail, or fill the form manually.");
    } catch {
      setParseError("Couldn't parse that - try the manual form.");
    } finally {
      setParsing(false);
    }
  };

  // Debounced auto-parse - fire 600ms after the user stops typing (min 6 chars).
  // No eslint-disable: exhaustive-deps at worst warns (non-fatal); guards prevent loops.
  useEffect(() => {
    const text = smartInput.trim();
    if (!open || view === "confirm" || parsing || text.length < 6) return;
    const t = setTimeout(() => { handleParseIntent(); }, 600);
    return () => clearTimeout(t);
  }, [smartInput, open, view]); // eslint-disable-line

  // Unified create - used by both "Yes, ignite it" and the manual "Create Bubble"
  const submit = async () => {
    if (!activity.trim() || !zone.trim()) {
      toast.error("Activity and zone are required");
      return;
    }
    if (startTime) {
      const start = new Date(startTime);
      if (isNaN(start.getTime())) { toast.error("Invalid start time"); return; }
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { toast.error("Sign in to create a bubble"); return; }

    setSubmitting(true); // disables the button immediately (dedupe guard #1)
    try {
      const res = await fetch("/api/bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          activity: activity.trim(),
          zone: zone.trim(),
          start_time: startTime ? new Date(startTime).toISOString() : undefined,
          duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
          max_members: maxMembers ? Number(maxMembers) : undefined,
          description: description.trim() || undefined,
          emoji: deriveEmoji(activity.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error ?? "Failed to create bubble"); return; }
      toast.success("Your bubble is live 🫧", { style: AMBER_TOAST });
      onCreated?.(data.data as ApiBubble);
      handleClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submit(); };

  // Confirmation-card display values (derived from parsed state)
  const previewEmoji = deriveEmoji(activity || smartInput);
  const previewTitle = activity ? (zone ? `${activity} at ${zone}` : activity) : "Your bubble";
  const previewStarting = startTime ? humanStartingIn(new Date(startTime).toISOString()) : "Now";
  const previewCapacity = maxMembers ? `Up to ${maxMembers} people` : "Open group";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
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
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
              style={{ background: "linear-gradient(90deg, #ff7a1a, #ffb56b, #ff7a1a)" }} />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {view === "confirm" ? "Ready to ignite?" : "Start Something"}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    {view === "confirm" ? "We parsed your idea - confirm or edit" : "What's happening on campus?"}
                  </p>
                </div>
                <motion.button type="button" onClick={handleClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" }}
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {view === "confirm" ? (
                  /* ── Confirmation card ── */
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, filter: "blur(12px)", y: 28 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(8px)", y: -12 }}
                    transition={{ duration: 0.5, ease }}
                  >
                    <div className="rounded-3xl p-6 relative overflow-hidden"
                      style={{
                        background: "linear-gradient(160deg, rgba(255,122,26,0.12), rgba(255,255,255,0.02))",
                        border: "1px solid rgba(255,122,26,0.25)",
                        boxShadow: "inset 0 1px 0 rgba(255,122,26,0.15)",
                      }}>
                      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(255,122,26,0.2), transparent 70%)" }} />
                      <div className="relative">
                        <div className="text-5xl mb-3">{previewEmoji}</div>
                        <h3 className="font-display text-2xl font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                          {previewTitle}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-sm" style={{ color: "#ffb56b" }}>
                            <Clock className="w-3.5 h-3.5" /> Starting {previewStarting === "Now" ? "now" : `in ${previewStarting}`}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            <Users className="w-3.5 h-3.5" style={{ color: "#ff7a1a" }} /> {previewCapacity}
                          </span>
                        </div>
                        {description.trim() && (
                          <p className="text-sm mt-4 italic" style={{ color: "var(--color-text-secondary)" }}>
                            &ldquo;{description.trim()}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <motion.button type="button" onClick={submit} disabled={submitting}
                        className="flex-1 h-12 rounded-full font-bold text-base flex items-center justify-center gap-2"
                        style={{
                          background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                          color: "#1a0a00",
                          boxShadow: "0 0 32px rgba(255,122,26,0.35)",
                          opacity: submitting ? 0.7 : 1,
                        }}
                        whileHover={submitting ? {} : { scale: 1.02, boxShadow: "0 0 48px rgba(255,122,26,0.5)" }}
                        whileTap={submitting ? {} : { scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <Flame className="w-4 h-4" />
                        {submitting ? "Igniting…" : "Yes, ignite it 🫧"}
                      </motion.button>
                      <motion.button type="button" onClick={() => setView("form")} disabled={submitting}
                        className="px-5 h-12 rounded-full font-semibold text-sm flex items-center gap-2"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-primary)" }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Manual form ── */
                  <motion.form
                    key="form"
                    className="space-y-5" onSubmit={handleSubmit}
                    initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(8px)", y: -12 }}
                    transition={{ duration: 0.4, ease }}
                  >
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
                          onChange={(e) => { setSmartInput(e.target.value); setParseError(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleParseIntent(); } }}
                          className="flex-1"
                        />
                        <motion.button type="button" onClick={handleParseIntent} disabled={parsing}
                          className="px-4 h-11 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5"
                          style={{ background: "rgba(255,122,26,0.15)", border: "1px solid rgba(255,122,26,0.25)", color: "#ff7a1a", opacity: parsing ? 0.6 : 1 }}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                          {parsing ? (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          ) : <Sparkles className="w-3.5 h-3.5" />}
                          {parsing ? "" : "Parse"}
                        </motion.button>
                      </div>
                      {(parsing || parseError) && (
                        <div className="flex items-center gap-2 text-xs pt-0.5">
                          {parsing ? (
                            <>
                              <span className="w-3 h-3 rounded-full border-2 animate-spin"
                                style={{ borderColor: "#ff7a1a", borderTopColor: "transparent" }} />
                              <span style={{ color: "#ffb56b" }}>Reading your idea…</span>
                            </>
                          ) : (
                            <span style={{ color: "#f87171" }}>{parseError}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <FieldGroup label="Activity">
                      <ChipGrid options={activityOptions} selected={activity} onSelect={(v) => setActivity(activity === v ? "" : v)} />
                      <WarmInput placeholder="Or type custom activity" value={activity} onChange={(e) => setActivity(e.target.value)} className="mt-2" />
                    </FieldGroup>

                    <FieldGroup label="Zone">
                      <ChipGrid options={zoneOptions} selected={zone} onSelect={(v) => setZone(zone === v ? "" : v)} />
                      <WarmInput placeholder="Or type zone" value={zone} onChange={(e) => setZone(e.target.value)} className="mt-2" />
                    </FieldGroup>

                    <div className="grid grid-cols-2 gap-3">
                      <FieldGroup label="Start Time">
                        <WarmInput type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Duration (min)">
                        <WarmInput type="number" placeholder="60" min="15" max="480" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                      </FieldGroup>
                    </div>

                    <FieldGroup label="Max Members (optional)">
                      <WarmInput type="number" placeholder="6" min="2" max="50" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} />
                    </FieldGroup>

                    <FieldGroup label="Description">
                      <textarea
                        placeholder="What's the plan?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                        maxLength={500}
                        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-primary)" }}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(255,122,26,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </FieldGroup>

                    <motion.button type="submit" disabled={submitting}
                      className="w-full h-12 rounded-full font-bold text-base"
                      style={{ background: "linear-gradient(135deg, #ff7a1a 0%, #ffb56b 100%)", color: "#1a0a00", boxShadow: "0 0 32px rgba(255,122,26,0.35)", opacity: submitting ? 0.7 : 1 }}
                      whileHover={submitting ? {} : { scale: 1.02, boxShadow: "0 0 48px rgba(255,122,26,0.5)" }}
                      whileTap={submitting ? {} : { scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      {submitting ? "Creating…" : "Create Bubble 🫧"}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
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
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-primary)", ...props.style }}
      onFocus={(e) => { e.target.style.borderColor = "rgba(255,122,26,0.4)"; props.onFocus?.(e); }}
      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; props.onBlur?.(e); }}
    />
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function ChipGrid({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <motion.button key={opt} type="button" onClick={() => onSelect(opt)}
          className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={selected === opt
            ? { background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", color: "#1a0a00", fontWeight: 700, border: "none" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
