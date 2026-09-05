import { bubbleSortMinutes } from "@/lib/eventSort";
import type { MapBubble } from "@/lib/mapClustering";

export type StartWithinId = "any" | "now" | "1h" | "3h" | "today";
export type TimeOfDayId = "any" | "morning" | "afternoon" | "evening" | "night";

export type MapTimeFilter = {
  startWithin: StartWithinId;
  timeOfDay: TimeOfDayId;
  onlyWithSpots: boolean;
};

export const DEFAULT_TIME_FILTER: MapTimeFilter = {
  startWithin: "any",
  timeOfDay: "any",
  onlyWithSpots: false,
};

export const START_WITHIN_OPTIONS: {
  id: StartWithinId;
  label: string;
  emoji: string;
}[] = [
  { id: "any", label: "Any time", emoji: "🗓️" },
  { id: "now", label: "Right now", emoji: "⚡" },
  { id: "1h", label: "Next hour", emoji: "⏱️" },
  { id: "3h", label: "Next 3 hrs", emoji: "🕒" },
  { id: "today", label: "Rest of today", emoji: "🌙" },
];

export const TIME_OF_DAY_OPTIONS: {
  id: TimeOfDayId;
  label: string;
  hint: string;
}[] = [
  { id: "any", label: "Any", hint: "" },
  { id: "morning", label: "Morning", hint: "5am–12pm" },
  { id: "afternoon", label: "Afternoon", hint: "12–5pm" },
  { id: "evening", label: "Evening", hint: "5–9pm" },
  { id: "night", label: "Night", hint: "9pm–5am" },
];

/** "Right now" keeps a small grace window so events mid-start still show. */
const START_WITHIN_MINUTES: Record<"now" | "1h" | "3h", number> = {
  now: 20,
  "1h": 60,
  "3h": 180,
};

/** [fromHour, toHour) in local time; `night` wraps past midnight. */
const TIME_OF_DAY_HOURS: Record<Exclude<TimeOfDayId, "any">, [number, number]> = {
  morning: [5, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  night: [21, 5],
};

/** Minutes from now until the bubble starts; 0 for anything already underway. */
export function minutesUntilStart(bubble: MapBubble): number {
  return Math.round(bubbleSortMinutes(bubble) / 60_000);
}

/**
 * Demo/mock bubbles only carry a relative "In 25 mins" string, so derive an
 * absolute start from whichever of the two the bubble actually has.
 */
function startDate(bubble: MapBubble): Date {
  return new Date(bubble.startTimeMs ?? Date.now() + minutesUntilStart(bubble) * 60_000);
}

function matchesStartWithin(bubble: MapBubble, id: StartWithinId): boolean {
  if (id === "any") return true;
  if (id === "today") {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return startDate(bubble).getTime() <= endOfToday.getTime();
  }
  return minutesUntilStart(bubble) <= START_WITHIN_MINUTES[id];
}

function matchesTimeOfDay(bubble: MapBubble, id: TimeOfDayId): boolean {
  if (id === "any") return true;
  const [from, to] = TIME_OF_DAY_HOURS[id];
  const hour = startDate(bubble).getHours();
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

function hasSpotsLeft(bubble: MapBubble): boolean {
  return bubble.maxPeople <= 0 || bubble.joined < bubble.maxPeople;
}

export function matchesTimeFilter(bubble: MapBubble, filter: MapTimeFilter): boolean {
  return (
    matchesStartWithin(bubble, filter.startWithin) &&
    matchesTimeOfDay(bubble, filter.timeOfDay) &&
    (!filter.onlyWithSpots || hasSpotsLeft(bubble))
  );
}

export function countActiveTimeFilters(filter: MapTimeFilter): number {
  return (
    (filter.startWithin !== "any" ? 1 : 0) +
    (filter.timeOfDay !== "any" ? 1 : 0) +
    (filter.onlyWithSpots ? 1 : 0)
  );
}

export function isTimeFilterActive(filter: MapTimeFilter): boolean {
  return countActiveTimeFilters(filter) > 0;
}

/** Short labels for the active-filter chips above the list. */
export function describeTimeFilter(filter: MapTimeFilter): string[] {
  const labels: string[] = [];
  if (filter.startWithin !== "any") {
    const opt = START_WITHIN_OPTIONS.find((o) => o.id === filter.startWithin);
    if (opt) labels.push(`${opt.emoji} ${opt.label}`);
  }
  if (filter.timeOfDay !== "any") {
    const opt = TIME_OF_DAY_OPTIONS.find((o) => o.id === filter.timeOfDay);
    if (opt) labels.push(`🕰️ ${opt.label}`);
  }
  if (filter.onlyWithSpots) labels.push("🎟️ Has spots");
  return labels;
}
