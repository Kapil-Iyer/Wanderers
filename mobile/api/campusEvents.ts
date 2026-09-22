import { fetchApi } from "@/api/client";

export type CampusEvent = {
  id: string;
  title: string;
  location: string;
  zone: string | null;
  date_time: string;
  organizer: string | null;
  category: string | null;
  source_url: string | null;
};

export function campusEvents() {
  return fetchApi<{ success: boolean; data: CampusEvent[]; fallback?: boolean }>(
    "/api/campus-events",
    { auth: false }
  );
}
