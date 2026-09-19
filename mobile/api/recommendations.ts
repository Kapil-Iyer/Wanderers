import { fetchApi } from "@/api/client";

export type RecommendedBubble = {
  id: string;
  title: string;
  emoji: string;
  zone: string;
  start_time: string;
  startingIn: string;
  joined: number;
  maxPeople: number;
  recommendationReason?: string;
};

export function recommendations() {
  return fetchApi<{ recommended_bubbles: RecommendedBubble[] }>(
    "/api/recommendations"
  );
}
