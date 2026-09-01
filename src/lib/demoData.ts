/**
 * DEMO DATA - the only content a guest ever sees.
 * -----------------------------------------------------------------------------
 * Guest mode (see src/contexts/GuestContext.tsx) never calls a Supabase-backed
 * API route and never touches the database. Every screen a guest can reach
 * (Home, Map, Profile, Onboarding) is populated entirely from this file
 * instead - no real bubble, message, moment, or user data is ever fetched.
 *
 * All ids are prefixed "demo-" so nothing here is ever mistaken for a real
 * UUID (see BubbleCard's UUID_RE check) - a guest tapping a demo card's Join
 * button is intercepted before any network call, but the prefix is a second,
 * cheap line of defense against that ever silently hitting a real API.
 * -----------------------------------------------------------------------------
 */

import type { Bubble } from "@/lib/mockData";

export const GUEST_DISPLAY_NAME = "Guest Wanderer";
export const GUEST_AVATAR = "🧭";
export const GUEST_INITIALS = "GW";

/**
 * 8 demo bubbles covering the range of things Wanderers is for. Zones match
 * real entries in MapOverlay's ZONE_COORDS lookup so demo pins land in the
 * correct place on the map instead of falling back to the default center.
 */
export const DEMO_BUBBLES: Bubble[] = [
  {
    id: "demo-1",
    emoji: "📚",
    title: "CS 245 Study Grind",
    category: "Study",
    zone: "DC Library 2nd Floor",
    joined: 4,
    maxPeople: 8,
    startingIn: "15 min",
    duration: "2 hr",
    distance: "0.2 km",
    description: "Working through the logic/proofs assignment together - bring your notes, we'll trade off explaining.",
    creator: "Demo Wanderer",
    creatorAvatar: "📚",
  },
  {
    id: "demo-2",
    emoji: "🏀",
    title: "Pickup Basketball",
    category: "Sports",
    zone: "PAC Courts",
    joined: 6,
    maxPeople: 10,
    startingIn: "30 min",
    duration: "1 hr",
    distance: "0.4 km",
    description: "Casual 5v5, all skill levels. Winner stays on.",
    creator: "Demo Wanderer",
    creatorAvatar: "🏀",
  },
  {
    id: "demo-3",
    emoji: "🍜",
    title: "Korean Food Run",
    category: "Casual",
    zone: "Uptown Waterloo",
    joined: 3,
    maxPeople: 6,
    startingIn: "1 hr",
    duration: "1.5 hr",
    distance: "1.2 km",
    description: "Craving tteokbokki and Korean fried chicken - walking uptown, come along.",
    creator: "Demo Wanderer",
    creatorAvatar: "🍜",
  },
  {
    id: "demo-4",
    emoji: "🧥",
    title: "Conestoga Mall Thrift Trip",
    category: "Casual",
    zone: "Conestoga Mall",
    joined: 2,
    maxPeople: 5,
    startingIn: "2 hr",
    duration: "2 hr",
    distance: "6 km",
    description: "Hitting the thrift stores at Conestoga - splitting an Uber, seats left.",
    creator: "Demo Wanderer",
    creatorAvatar: "🧥",
  },
  {
    id: "demo-5",
    emoji: "🏓",
    title: "Ping Pong at SLC",
    category: "Sports",
    zone: "SLC Game Room",
    joined: 3,
    maxPeople: 4,
    startingIn: "Now",
    duration: "45 min",
    distance: "0.3 km",
    description: "Table's free, need one more for doubles.",
    creator: "Demo Wanderer",
    creatorAvatar: "🏓",
  },
  {
    id: "demo-6",
    emoji: "🧑‍💻",
    title: "Late Night Coding Session",
    category: "Study",
    zone: "MC Study Hall",
    joined: 5,
    maxPeople: 12,
    startingIn: "3 hr",
    duration: "3 hr",
    distance: "0.3 km",
    description: "Hackathon prep - bring your laptop, we've got the whiteboard room booked.",
    creator: "Demo Wanderer",
    creatorAvatar: "🧑‍💻",
  },
  {
    id: "demo-7",
    emoji: "🍲",
    title: "Cultural Cooking Night",
    category: "Casual",
    zone: "Village 1 Rec Room",
    joined: 7,
    maxPeople: 10,
    startingIn: "4 hr",
    duration: "2.5 hr",
    distance: "0.6 km",
    description: "Everyone brings a dish from home and the story behind it - potluck style.",
    creator: "Demo Wanderer",
    creatorAvatar: "🍲",
  },
  {
    id: "demo-8",
    emoji: "🥾",
    title: "Laurel Creek Sunset Walk",
    category: "Outdoors",
    zone: "Laurel Creek",
    joined: 4,
    maxPeople: 8,
    startingIn: "5 hr",
    duration: "1 hr",
    distance: "1.8 km",
    description: "Easy walk along the trail, back before dark. Bring a jacket.",
    creator: "Demo Wanderer",
    creatorAvatar: "🥾",
  },
];

/** Alias so map-specific code can import a name that reads clearly there. */
export const DEMO_MAP_MARKERS = DEMO_BUBBLES;

export const DEMO_PROFILE = {
  name: GUEST_DISPLAY_NAME,
  avatar: GUEST_AVATAR,
  initials: GUEST_INITIALS,
  university: "University of Waterloo",
  bio: "Just here to see what Wanderers is about.",
  vibeTags: ["Exploring", "University of Waterloo"],
  interests: ["☕ Coffee", "🏀 Basketball", "📚 Studying", "🥾 Hiking"],
  personalityTraits: ["Chill", "Adventurous"],
  stats: [
    { label: "Connections", value: "—", star: false },
    { label: "Events Attended", value: "—", star: false },
    { label: "Vibe Rating", value: "—", star: true },
  ],
};
