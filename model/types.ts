/**
 * Shared types for the recommender model
 */

export type User = {
  id: string;
  name: string;
  interests: string[];
  campus: string;
  preferredTime: "morning" | "afternoon" | "evening";
  cluster: string;
};

export type Bubble = {
  id: string;
  emoji: string;
  title: string;
  category: string;
  joined: number;
  maxPeople: number;
  startingIn: string;
  distance: string;
  description: string;
  lat?: number;
  lng?: number;
  creator: string;
  creatorAvatar: string;
};

export type ScoredBubble = Bubble & {
  recommendationScore: number;
  recommendationReason: string;
};
