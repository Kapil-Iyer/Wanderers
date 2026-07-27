"use client";

import { useMemo, useState } from "react";
import { PEPE_EMOTES } from "@/lib/pepeEmotes";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (shortcode: string) => void;
};

export default function EmotePicker({ open, onClose, onPick }: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return PEPE_EMOTES;
    return PEPE_EMOTES.filter((e) => e.name.toLowerCase().includes(needle));
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-2xl overflow-hidden z-50"
      style={{
        background: "rgba(22,16,12,0.96)",
        border: "1px solid rgba(255,122,26,0.18)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Pepe emotes…"
          className="flex-1 bg-transparent text-xs outline-none py-1"
          style={{ color: "var(--color-text-primary)" }}
          autoFocus
        />
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold px-2 py-1 rounded-full"
          style={{ color: "var(--color-text-muted)" }}
        >
          Close
        </button>
      </div>
      <div className="max-h-52 overflow-y-auto p-2 grid grid-cols-6 sm:grid-cols-8 gap-1">
        {filtered.map((e) => (
          <button
            key={e.id}
            type="button"
            title={e.name}
            onClick={() => {
              onPick(`:${e.name}:`);
              onClose();
            }}
            className="aspect-square rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors p-1"
          >
            <img src={e.url} alt={e.name} className="w-8 h-8 object-contain" draggable={false} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-xs py-6" style={{ color: "var(--color-text-muted)" }}>
            No emotes match
          </p>
        )}
      </div>
      <p className="px-3 py-1.5 text-[10px] border-t border-white/5" style={{ color: "var(--color-text-muted)" }}>
        Pepe set via 7TV · tap to insert
      </p>
    </div>
  );
}
