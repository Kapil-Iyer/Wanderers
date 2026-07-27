/**
 * Pepe emote set (7TV) for home greeting + chat picker.
 * Source set: https://7tv.app/emote-sets/64060d2412d8e1819f06b860
 * pepeWave added for the home greeting (not in that set).
 */

import set from "@/lib/pepeEmotes.json";

export type PepeEmote = {
  name: string;
  id: string;
  url: string;
  animated?: boolean;
};

export const PEPE_WAVE: PepeEmote = {
  name: "pepeWave",
  id: "01GGNVAT700008JJZ5HQVXF2YN",
  url: "https://cdn.7tv.app/emote/01GGNVAT700008JJZ5HQVXF2YN/2x.webp",
  animated: true,
};

const fromSet = (set.emotes ?? []) as PepeEmote[];

/** Full picker list: pepeWave first, then the Pepe Emotes set (deduped by name). */
export const PEPE_EMOTES: PepeEmote[] = (() => {
  const seen = new Set<string>([PEPE_WAVE.name.toLowerCase()]);
  const list: PepeEmote[] = [PEPE_WAVE];
  for (const e of fromSet) {
    const key = e.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(e);
  }
  return list;
})();

export const PEPE_EMOTE_BY_NAME = new Map(
  PEPE_EMOTES.map((e) => [e.name.toLowerCase(), e])
);

/** Match :emoteName: shortcodes in message text. */
export const EMOTE_TOKEN_RE = /:([A-Za-z0-9_-]+):/g;

export function resolvePepeEmote(name: string): PepeEmote | undefined {
  return PEPE_EMOTE_BY_NAME.get(name.toLowerCase());
}
