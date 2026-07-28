/**
 * =============================================================================
 * MOCK DATA - API INTEGRATION REFERENCE
 * =============================================================================
 * All data in this file is MOCK/STATIC. Replace with API calls during integration.
 *
 * INTEGRATION POINTS:
 * - mockBubbles         → GET /api/bubbles or Supabase bubbles table
 * - mockConversations   → GET /api/conversations or Supabase messages
 * - mockFeedPosts       → GET /api/feed or Supabase feed/meetup_photos
 * - mockUserProfiles    → GET /api/users/:id or Supabase users + profiles
 * - mockConnectedFriends → GET /api/connections or Supabase connections
 * - mockConnectionRequests → GET /api/connection-requests
 * - filterChips         → May come from API or stay static
 *
 * HELPERS TO REPLACE:
 * - getProfileByName()  → API lookup by username
 * - getOrCreateProfile() → API create + fetch
 * - getProfileById()    → GET /api/users/:id
 * =============================================================================
 */

export interface BubbleParticipant {
  id: string;
  name: string;
  avatar: string;
}

export interface Bubble {
  id: string;
  emoji: string;
  title: string;
  category: string;
  zone?: string;
  joined: number;
  maxPeople: number;
  startingIn: string;
  duration: string;
  distance: string;
  description: string;
  lat?: number;
  lng?: number;
  creator: string;
  creatorAvatar: string;
  participants?: BubbleParticipant[];
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
}

// University of Waterloo building coordinates
// PAC: Physical Activities Complex | DC: Davis Centre (library/study) | SLC: Student Life Centre
export const mockBubbles: Bubble[] = [
  {
    id: "1",
    emoji: "🏀",
    title: "3v3 Basketball at PAC",
    category: "Sports",
    zone: "PAC",
    joined: 0,
    maxPeople: 6,
    startingIn: "15 mins",
    duration: "1 hr",
    distance: "0.2 km",
    description: "Pickup game at the PAC gym. Looking for 2 more players!",
    lat: 43.4722,
    lng: -80.5461,
    creator: "Marcus J.",
    creatorAvatar: "MJ",
    participants: [],
  },
  {
    id: "2",
    emoji: "📚",
    title: "CS 341 Study Group - DC Library",
    category: "Study",
    zone: "DC",
    joined: 0,
    maxPeople: 8,
    startingIn: "1 hr",
    duration: "2 hrs",
    distance: "0.1 km",
    description: "Midterm prep in Davis Centre library. Room 1301.",
    lat: 43.4725,
    lng: -80.5422,
    creator: "Alex W.",
    creatorAvatar: "AW",
    participants: [],
  },
  {
    id: "3",
    emoji: "🎮",
    title: "Smash Bros at PAC Lounge",
    category: "Gaming",
    zone: "PAC",
    joined: 0,
    maxPeople: 8,
    startingIn: "45 mins",
    duration: "2 hrs",
    distance: "0.2 km",
    description: "Casual Smash tournament in PAC common area. All skill levels welcome!",
    lat: 43.4719,
    lng: -80.5458,
    creator: "Danny L.",
    creatorAvatar: "DL",
    participants: [],
  },
  {
    id: "4",
    emoji: "☕",
    title: "Coffee & Chat - SLC",
    category: "Casual",
    zone: "SLC",
    joined: 0,
    maxPeople: 5,
    startingIn: "30 mins",
    duration: "1 hr",
    distance: "0.3 km",
    description: "Grabbing coffee at the Student Life Centre. Anyone want to join?",
    lat: 43.4705,
    lng: -80.5442,
    creator: "Sarah K.",
    creatorAvatar: "SK",
    participants: [],
  },
  {
    id: "5",
    emoji: "🏃",
    title: "Pickup Volleyball - PAC",
    category: "Sports",
    zone: "PAC",
    joined: 0,
    maxPeople: 12,
    startingIn: "20 mins",
    duration: "1 hr 30 mins",
    distance: "0.2 km",
    description: "Beach volleyball at PAC outdoor courts. Bring water!",
    lat: 43.4724,
    lng: -80.5463,
    creator: "Jordan T.",
    creatorAvatar: "JT",
    participants: [],
  },
  {
    id: "6",
    emoji: "📖",
    title: "Math 136 Study Session - DC",
    category: "Study",
    zone: "DC",
    joined: 0,
    maxPeople: 6,
    startingIn: "2 hrs",
    duration: "3 hrs",
    distance: "0.1 km",
    description: "Linear algebra practice in Davis Centre. Second floor study area.",
    lat: 43.4726,
    lng: -80.5425,
    creator: "Priya R.",
    creatorAvatar: "PR",
    participants: [],
  },
  {
    id: "7",
    emoji: "⚽",
    title: "Soccer at Columbia Fields",
    category: "Sports",
    joined: 0,
    maxPeople: 14,
    startingIn: "1 hr",
    duration: "2 hrs",
    distance: "0.5 km",
    description: "Casual soccer game. All skill levels welcome!",
    lat: 43.4698,
    lng: -80.5480,
    creator: "Omar H.",
    creatorAvatar: "OH",
    participants: [],
  },
  {
    id: "8",
    emoji: "🎵",
    title: "Open Mic Night - MC",
    category: "Music",
    joined: 0,
    maxPeople: 20,
    startingIn: "3 hrs",
    duration: "3 hrs",
    distance: "0.2 km",
    description: "Bring your instrument or just come listen. MC Comfy Lounge.",
    lat: 43.4715,
    lng: -80.5435,
    creator: "Nina S.",
    creatorAvatar: "NS",
    participants: [],
  },
  {
    id: "9",
    emoji: "🏊",
    title: "Lap Swim - PAC Pool",
    category: "Sports",
    joined: 0,
    maxPeople: 8,
    startingIn: "45 mins",
    duration: "1 hr",
    distance: "0.2 km",
    description: "Swimming laps at PAC. Pace yourself!",
    lat: 43.4720,
    lng: -80.5460,
    creator: "Chris B.",
    creatorAvatar: "CB",
    participants: [],
  },
  {
    id: "10",
    emoji: "🧑‍💻",
    title: "LeetCode Practice - SLC",
    category: "Study",
    joined: 0,
    maxPeople: 6,
    startingIn: "30 mins",
    duration: "2 hrs",
    distance: "0.3 km",
    description: "Grinding interview prep together. Bring your laptop!",
    lat: 43.4708,
    lng: -80.5440,
    creator: "Kevin L.",
    creatorAvatar: "KL",
    participants: [],
  },
  {
    id: "11",
    emoji: "🥾",
    title: "Hike Laurel Creek Trail",
    category: "Outdoors",
    joined: 0,
    maxPeople: 8,
    startingIn: "2 hrs",
    duration: "3 hrs",
    distance: "1.2 km",
    description: "Short hike along Laurel Creek. Meet at park entrance.",
    lat: 43.4680,
    lng: -80.5500,
    creator: "Emma T.",
    creatorAvatar: "ET",
    participants: [],
  },
  {
    id: "12",
    emoji: "🎲",
    title: "Board Games - EV3",
    category: "Casual",
    joined: 0,
    maxPeople: 10,
    startingIn: "1 hr",
    duration: "2 hrs",
    distance: "0.1 km",
    description: "Catan, Codenames, and more. Engineering building lounge.",
    lat: 43.4730,
    lng: -80.5420,
    creator: "Mike R.",
    creatorAvatar: "MR",
    participants: [],
  },
];

export const mockConversations: Conversation[] = [
  { id: "1", name: "3v3 Basketball", avatar: "🏀", lastMessage: "See you at the courts!", time: "2m ago", unread: 2 },
  { id: "2", name: "Sarah K.", avatar: "SK", lastMessage: "The latte here is amazing", time: "15m ago", unread: 0 },
  { id: "3", name: "CS 341 Study Group", avatar: "📚", lastMessage: "Can someone share the notes?", time: "1h ago", unread: 5 },
  { id: "4", name: "Marcus J.", avatar: "MJ", lastMessage: "Good game today!", time: "3h ago", unread: 0 },
];

export const mockMessages: Message[] = [
  { id: "1", text: "Hey, are we still on for the courts?", sender: "other", time: "4:30 PM" },
  { id: "2", text: "Yeah! I'll be there in 15", sender: "me", time: "4:32 PM" },
  { id: "3", text: "Cool, I'm bringing my friend too", sender: "other", time: "4:33 PM" },
  { id: "4", text: "Perfect, we need one more!", sender: "me", time: "4:34 PM" },
  { id: "5", text: "See you at the courts!", sender: "other", time: "4:35 PM" },
];

export const interestOptions = [
  "🏀 Basketball", "⚽ Soccer", "🏃 Running", "🧘 Yoga",
  "☕ Coffee", "🍕 Food", "🎮 Gaming", "📚 Studying",
  "🎵 Music", "🎨 Arts", "🥾 Hiking", "🏊 Swimming",
  "📷 Photography", "💃 Dancing", "🎭 Theater", "🧑‍💻 Coding",
  "🎲 Board Games", "🌱 Gardening", "🏓 Ping Pong", "🎤 Karaoke",
];

export const filterChips = ["All", "Happening Now", "Starting Soon", "Sports", "Casual", "Study", "Music", "Gaming", "Outdoors"];

export interface FeedComment {
  id: string;
  username: string;
  text: string;
}

export interface FeedPost {
  id: string;
  username: string;
  userAvatar: string;
  imagePlaceholder?: string;
  imageUrl?: string;
  activity?: string;
  zone?: string;
  participants?: { name: string; avatar: string }[];
  caption: string;
  likes?: number;
  comments?: FeedComment[];
  timestamp: string;
}

export const mockFeedPosts: FeedPost[] = [
  {
    id: "f1",
    username: "alex.chen",
    userAvatar: "AC",
    activity: "Basketball",
    zone: "PAC",
    caption: "Pickup game at the PAC gym!",
    participants: [{ name: "Marcus J.", avatar: "MJ" }, { name: "Jordan T.", avatar: "JT" }],
    timestamp: "2H AGO",
  },
  {
    id: "f2",
    username: "sarah.k",
    userAvatar: "SK",
    activity: "Study",
    zone: "DC",
    caption: "Study sesh at DC Library. Midterm prep mode ✨",
    participants: [{ name: "Priya R.", avatar: "PR" }],
    timestamp: "4H AGO",
  },
  {
    id: "f3",
    username: "marcus.j",
    userAvatar: "MJ",
    activity: "Smash Bros at PAC Lounge",
    zone: "PAC",
    caption: "Tournament was a blast. GGs everyone 🎮",
    participants: [{ name: "Danny L.", avatar: "DL" }, { name: "Alex W.", avatar: "AW" }],
    timestamp: "6H AGO",
  },
  {
    id: "f4",
    username: "priya.r",
    userAvatar: "PR",
    activity: "Coffee",
    zone: "SLC",
    caption: "Coffee at SLC hit different today ☕",
    participants: [],
    timestamp: "1D AGO",
  },
];

export const personalityTraits = ["Chill", "Energetic", "Punctual", "Funny", "Creative", "Organized", "Adventurous", "Friendly"];

export interface ConnectedFriend {
  id: string;
  name: string;
  avatar: string;
  currentEvent?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  connections: number;
  eventsAttended: number;
  personalityTraits: string[];
  interests: string[];
  pastBubbles: { title: string; emoji: string; category: string }[];
}

// Normalize name for lookup: "Marcus J." -> "marcus j", "marcus.j" -> "marcus j"
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[.\s]/g, " ").trim().replace(/\s+/g, " ");
}

export const mockUserProfiles: UserProfile[] = [
  { id: "u1", name: "Marcus J.", avatar: "MJ", connections: 18, eventsAttended: 12, personalityTraits: ["Chill", "Energetic", "Friendly"], interests: ["🏀 Basketball", "🏃 Running", "☕ Coffee"], pastBubbles: mockBubbles.slice(0, 3).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u2", name: "Sarah K.", avatar: "SK", connections: 24, eventsAttended: 8, personalityTraits: ["Creative", "Friendly", "Organized"], interests: ["☕ Coffee", "📚 Studying", "🎵 Music"], pastBubbles: mockBubbles.slice(2, 5).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u3", name: "Alex W.", avatar: "AW", connections: 31, eventsAttended: 15, personalityTraits: ["Punctual", "Creative", "Organized"], interests: ["📚 Studying", "🧑‍💻 Coding", "🎮 Gaming"], pastBubbles: mockBubbles.slice(1, 4).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u4", name: "Danny L.", avatar: "DL", connections: 12, eventsAttended: 6, personalityTraits: ["Funny", "Adventurous", "Friendly"], interests: ["🎮 Gaming", "☕ Coffee", "🎲 Board Games"], pastBubbles: mockBubbles.slice(2, 5).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u5", name: "Priya R.", avatar: "PR", connections: 22, eventsAttended: 10, personalityTraits: ["Organized", "Punctual", "Friendly"], interests: ["📚 Studying", "🧘 Yoga", "☕ Coffee"], pastBubbles: mockBubbles.slice(1, 4).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u6", name: "Jordan T.", avatar: "JT", connections: 19, eventsAttended: 9, personalityTraits: ["Energetic", "Adventurous", "Friendly"], interests: ["🏃 Running", "🏀 Basketball", "🥾 Hiking"], pastBubbles: mockBubbles.slice(0, 3).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u7", name: "Sam L.", avatar: "SL", connections: 8, eventsAttended: 4, personalityTraits: ["Chill", "Creative"], interests: ["🎮 Gaming", "🎵 Music"], pastBubbles: mockBubbles.slice(0, 2).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u8", name: "Riley M.", avatar: "RM", connections: 14, eventsAttended: 5, personalityTraits: ["Adventurous", "Friendly"], interests: ["🎲 Board Games", "☕ Coffee"], pastBubbles: mockBubbles.slice(2, 4).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u9", name: "alex.chen", avatar: "AC", connections: 28, eventsAttended: 14, personalityTraits: ["Creative", "Energetic", "Friendly"], interests: ["🏀 Basketball", "📷 Photography", "☕ Coffee"], pastBubbles: mockBubbles.slice(0, 4).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u10", name: "marcus.j", avatar: "MJ", connections: 18, eventsAttended: 12, personalityTraits: ["Chill", "Energetic", "Friendly"], interests: ["🏀 Basketball", "🏃 Running", "☕ Coffee"], pastBubbles: mockBubbles.slice(0, 3).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u11", name: "sarah.k", avatar: "SK", connections: 24, eventsAttended: 8, personalityTraits: ["Creative", "Friendly", "Organized"], interests: ["☕ Coffee", "📚 Studying", "🎵 Music"], pastBubbles: mockBubbles.slice(2, 5).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u12", name: "priya.r", avatar: "PR", connections: 22, eventsAttended: 10, personalityTraits: ["Organized", "Punctual", "Friendly"], interests: ["📚 Studying", "🧘 Yoga", "☕ Coffee"], pastBubbles: mockBubbles.slice(1, 4).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u13", name: "danny.l", avatar: "DL", connections: 12, eventsAttended: 6, personalityTraits: ["Funny", "Adventurous", "Friendly"], interests: ["🎮 Gaming", "☕ Coffee", "🎲 Board Games"], pastBubbles: mockBubbles.slice(2, 5).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u14", name: "maya.k", avatar: "MK", connections: 15, eventsAttended: 7, personalityTraits: ["Creative", "Friendly"], interests: ["📷 Photography", "☕ Coffee"], pastBubbles: mockBubbles.slice(2, 4).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
  { id: "u15", name: "jordan_w", avatar: "JW", connections: 11, eventsAttended: 5, personalityTraits: ["Adventurous", "Energetic"], interests: ["🏀 Basketball", "🥾 Hiking"], pastBubbles: mockBubbles.slice(0, 2).map((b) => ({ title: b.title, emoji: b.emoji, category: b.category })) },
];

export function getProfileByName(name: string, avatar?: string): UserProfile | null {
  const normalized = normalizeName(name);
  const found = mockUserProfiles.find((p) => normalizeName(p.name) === normalized);
  if (found) return found;
  if (avatar) {
    const byAvatar = mockUserProfiles.find((p) => p.avatar === avatar);
    if (byAvatar) return byAvatar;
  }
  return null;
}

export function getProfileById(id: string): UserProfile | null {
  return mockUserProfiles.find((p) => p.id === id) ?? null;
}

export function getOrCreateProfile(name: string, avatar?: string): UserProfile {
  const existing = getProfileByName(name, avatar);
  if (existing) return existing;
  const displayName = name.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: `guest-${name}`,
    name: displayName,
    avatar: avatar ?? name.slice(0, 2).toUpperCase(),
    connections: 0,
    eventsAttended: 0,
    personalityTraits: [],
    interests: [],
    pastBubbles: [],
  };
}

export interface ConnectionRequest {
  id: string;
  name: string;
  avatar: string;
}

export const mockConnectionRequests: ConnectionRequest[] = [
  { id: "cr1", name: "Taylor W.", avatar: "TW" },
  { id: "cr2", name: "Omar H.", avatar: "OH" },
  { id: "cr3", name: "Maya K.", avatar: "MK" },
];

export const mockConnectedFriends: ConnectedFriend[] = [
  { id: "1", name: "Marcus J.", avatar: "MJ", currentEvent: "3v3 Basketball at PAC" },
  { id: "2", name: "Sarah K.", avatar: "SK", currentEvent: "Coffee & Chat - SLC" },
  { id: "3", name: "Alex W.", avatar: "AW", currentEvent: "CS 341 Study Group - DC Library" },
  { id: "4", name: "Danny L.", avatar: "DL", currentEvent: "Smash Bros at PAC Lounge" },
  { id: "5", name: "Priya R.", avatar: "PR", currentEvent: "Math 136 Study Session - DC" },
  { id: "6", name: "Jordan T.", avatar: "JT", currentEvent: "Pickup Volleyball - PAC" },
  { id: "7", name: "Sam L.", avatar: "SL" },
  { id: "8", name: "Riley M.", avatar: "RM" },
];
