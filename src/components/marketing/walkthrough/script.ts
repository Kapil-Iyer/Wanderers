/**
 * Timeline data for the marketing hero product walkthrough.
 *
 * This is a *recreation* of the real app screens, not a live session: the
 * marketing page must never touch real student data (same rule that governs
 * guest mode). Every name, message and photo below is invented for the demo.
 *
 * Keep this file as the single source of truth for copy + timings so the
 * walkthrough can be retimed without touching the scene components.
 */

export const DEMO_USER = {
  name: "Kapil Iyer",
  email: "k22iyer@uwaterloo.ca",
  initials: "KI",
  otp: "482917",
} as const;

/** The activity the demo student creates. Zone exists in MapOverlay's ZONE_COORDS. */
export const DEMO_ACTIVITY = {
  emoji: "📷",
  title: "Analog film photo walk",
  zone: "Laurel Creek",
  category: "Outdoors",
  startingIn: "in 25 min",
  duration: "1h 30m",
  maxPeople: 6,
  description:
    "Bringing a film body and a couple rolls. Golden hour along the creek, chill pace, all skill levels.",
} as const;

/** Warm accent family used across the real app screens (home/chat/profile/feed). */
export const WARM = {
  from: "#ff7a1a",
  to: "#ffb56b",
  ink: "#2a1206",
  tint: "rgba(255,122,26,0.12)",
  edge: "rgba(255,122,26,0.28)",
} as const;

/** Outdoors category theme, matching src/lib/categoryThemes.ts. */
export const OUTDOORS = {
  from: "#22d3ee",
  to: "#10b981",
  accent: "#6ee7b7",
} as const;

export type CastMember = {
  name: string;
  initials: string;
  tint: string;
  accent: string;
};

/** Other wanderers who join the bubble. Deliberately no pronouns anywhere. */
export const CAST: CastMember[] = [
  { name: "Priya R.", initials: "PR", tint: "rgba(34,211,238,0.16)", accent: "#67e8f9" },
  { name: "Marcus C.", initials: "MC", tint: "rgba(167,139,250,0.16)", accent: "#c4b5fd" },
  { name: "Aisha O.", initials: "AO", tint: "rgba(244,114,182,0.16)", accent: "#f9a8d4" },
  { name: "Ty N.", initials: "TN", tint: "rgba(110,231,183,0.16)", accent: "#6ee7b7" },
];

export type ChatLine = {
  /** ms offset within the chat scene */
  at: number;
  /** index into CAST, or "me" for the demo user */
  who: "me" | 0 | 1 | 2 | 3;
  text: string;
  time: string;
};

export const CHAT_LINES: ChatLine[] = [
  { at: 5200, who: 0, text: "wait i've been looking for a film walk forever 😭", time: "7:02" },
  { at: 7600, who: "me", text: "pulled out my dad's old AE-1, hoping it still fires", time: "7:02" },
  { at: 10200, who: 1, text: "i've got a roll of Portra 400 i'll split with someone", time: "7:03" },
  { at: 13000, who: 2, text: "bridge by the dam? golden hour hits ~7:40", time: "7:04" },
  { at: 16000, who: "me", text: "perfect — bridge at 7:15, walk the loop, done by 8:30", time: "7:04" },
  { at: 19000, who: 3, text: "bringing a spare body if anyone wants to shoot two 📸", time: "7:05" },
  { at: 21400, who: 2, text: "locked in", time: "7:05" },
];

/** Bots joining the bubble, ms offset within the chat scene. */
export const JOIN_EVENTS: { at: number; who: number }[] = [
  { at: 1400, who: 0 },
  { at: 3000, who: 1 },
  { at: 8800, who: 2 },
  { at: 17600, who: 3 },
];

export type MomentComment = {
  at: number;
  who: number;
  text: string;
};

export const MOMENT_COMMENTS: MomentComment[] = [
  { at: 5600, who: 0, text: "frame 11 is unreal 🔥" },
  { at: 8000, who: 3, text: "the light on the water omg" },
  { at: 10400, who: 1, text: "same time next week??" },
];

/** Bubbles shown in the feed / map / explore scenes. */
export type DemoBubble = {
  emoji: string;
  title: string;
  zone: string;
  startingIn: string;
  joined: number;
  max: number;
  category: string;
  from: string;
  to: string;
  accent: string;
  offCampus?: boolean;
};

export const FEED_BUBBLES: DemoBubble[] = [
  {
    emoji: "🏀",
    title: "Pickup basketball, 5v5",
    zone: "PAC Courts",
    startingIn: "in 20 min",
    joined: 7,
    max: 10,
    category: "Sports",
    from: "#8b5cf6",
    to: "#6366f1",
    accent: "#a78bfa",
  },
  {
    emoji: "📚",
    title: "CS 341 midterm grind",
    zone: "DC Library 2nd Floor",
    startingIn: "in 45 min",
    joined: 4,
    max: 8,
    category: "Study",
    from: "#22d3ee",
    to: "#6366f1",
    accent: "#67e8f9",
  },
  {
    emoji: "🏓",
    title: "Ping pong ladder",
    zone: "SLC Game Room",
    startingIn: "in 10 min",
    joined: 5,
    max: 6,
    category: "Casual",
    from: "#a78bfa",
    to: "#22d3ee",
    accent: "#c4b5fd",
  },
];

export const EXPLORE_ON_CAMPUS: DemoBubble[] = [
  {
    emoji: "🎹",
    title: "Piano room open jam",
    zone: "SLC Atrium",
    startingIn: "in 15 min",
    joined: 3,
    max: 8,
    category: "Music",
    from: "#ec4899",
    to: "#8b5cf6",
    accent: "#f9a8d4",
  },
  {
    emoji: "🎲",
    title: "Catan, no table talk",
    zone: "Village 1 Rec Room",
    startingIn: "in 40 min",
    joined: 3,
    max: 4,
    category: "Gaming",
    from: "#d946ef",
    to: "#8b5cf6",
    accent: "#e879f9",
  },
  {
    emoji: "🧘",
    title: "Sunrise yoga on the green",
    zone: "BMH Green",
    startingIn: "tomorrow 6:30",
    joined: 6,
    max: 12,
    category: "Casual",
    from: "#a78bfa",
    to: "#22d3ee",
    accent: "#c4b5fd",
  },
];

export const EXPLORE_OFF_CAMPUS: DemoBubble[] = [
  {
    emoji: "🧗",
    title: "Bouldering drop-in",
    zone: "Grand River Rocks",
    startingIn: "in 1 h",
    joined: 4,
    max: 6,
    category: "Sports",
    from: "#8b5cf6",
    to: "#6366f1",
    accent: "#a78bfa",
    offCampus: true,
  },
  {
    emoji: "🌽",
    title: "Korean corn dog run",
    zone: "Uptown Waterloo",
    startingIn: "in 30 min",
    joined: 5,
    max: 7,
    category: "Casual",
    from: "#a78bfa",
    to: "#22d3ee",
    accent: "#c4b5fd",
    offCampus: true,
  },
  {
    emoji: "🧥",
    title: "Thrift crawl + food court",
    zone: "Conestoga Mall",
    startingIn: "Sat 1:00",
    joined: 6,
    max: 10,
    category: "Casual",
    from: "#a78bfa",
    to: "#22d3ee",
    accent: "#c4b5fd",
    offCampus: true,
  },
];

/** Pins pre-existing on the map, in canvas-relative % coords. */
export const MAP_PINS = [
  { emoji: "🏀", title: "Pickup ball", joined: 7, max: 10, x: 26, y: 30, accent: "#fb923c" },
  { emoji: "📚", title: "CS 341", joined: 4, max: 8, x: 62, y: 22, accent: "#60a5fa" },
  { emoji: "🏓", title: "Ping pong", joined: 5, max: 6, x: 74, y: 54, accent: "#22d3ee" },
  { emoji: "🎹", title: "Piano jam", joined: 3, max: 8, x: 44, y: 62, accent: "#f472b6" },
] as const;

/** Where the newly created bubble's pin lands. */
export const NEW_PIN = { x: 33, y: 47 } as const;

export type SceneId =
  | "login"
  | "otp"
  | "feed"
  | "create"
  | "map"
  | "chat"
  | "live"
  | "moment"
  | "profile"
  | "explore";

export type Scene = {
  id: SceneId;
  /** ms from the start of the loop */
  start: number;
  /** ms */
  duration: number;
  /** Chapter label on the rail */
  chapter: string;
  /** Caption shown under the frame */
  caption: string;
};

export const SCENES: Scene[] = [
  {
    id: "login",
    start: 0,
    duration: 7000,
    chapter: "Sign in",
    caption: "Sign in with a @uwaterloo.ca email — students only, no randoms.",
  },
  {
    id: "otp",
    start: 7000,
    duration: 6000,
    chapter: "Verify",
    caption: "A one-time code confirms you actually go here.",
  },
  {
    id: "feed",
    start: 13000,
    duration: 9000,
    chapter: "Feed",
    caption: "Land on a live feed of what's happening within walking distance.",
  },
  {
    id: "create",
    start: 22000,
    duration: 14000,
    chapter: "Start something",
    caption: "Type a plan in plain English — AI fills in the category, zone and time.",
  },
  {
    id: "map",
    start: 36000,
    duration: 11000,
    chapter: "Live map",
    caption: "It drops onto the campus map the moment it's created.",
  },
  {
    id: "chat",
    start: 47000,
    duration: 24000,
    chapter: "Join & plan",
    caption: "Chat unlocks as wanderers join, and the plan settles itself.",
  },
  {
    id: "live",
    start: 71000,
    duration: 7000,
    chapter: "It happens",
    caption: "Then the part that actually matters — people show up.",
  },
  {
    id: "moment",
    start: 78000,
    duration: 13000,
    chapter: "Wander Moment",
    caption: "When it ends, capture a Moment and post it to the shared feed.",
  },
  {
    id: "profile",
    start: 91000,
    duration: 9000,
    chapter: "Connect",
    caption: "Send a “Wanna Wander?” to keep the people you clicked with.",
  },
  {
    id: "explore",
    start: 100000,
    duration: 10000,
    chapter: "Explore",
    caption: "Then go again — on campus, or well past it.",
  },
];

export const TOTAL_DURATION = SCENES.reduce((max, s) => Math.max(max, s.start + s.duration), 0);

export function sceneAt(t: number): { scene: Scene; index: number; local: number } {
  for (let i = SCENES.length - 1; i >= 0; i -= 1) {
    if (t >= SCENES[i].start) {
      return { scene: SCENES[i], index: i, local: t - SCENES[i].start };
    }
  }
  return { scene: SCENES[0], index: 0, local: t };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
