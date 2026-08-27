"use client";

/**
 * Conversations - joined bubble chats.
 * Hydrates from GET /api/bubbles/mine so Messages survives refresh / Back.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Conversation } from "@/lib/mockData";
import type { Bubble, BubbleParticipant } from "@/lib/mockData";
import { deriveEmoji } from "@/lib/bubbleMap";
import { supabase } from "@/lib/supabase";

export type BubbleConversation = Conversation & {
  memberNames?: string[];
  duration?: string;
  zone?: string;
  participants?: BubbleParticipant[];
  joined?: number;
  starred?: boolean;
};

type MineBubble = {
  id: string;
  activity: string;
  zone?: string | null;
  emoji?: string | null;
  start_time?: string | null;
  duration_minutes?: number | null;
  max_members?: number | null;
  status?: string | null;
  expires_at?: string | null;
  members_count?: number;
  starred?: boolean;
};

type ConversationsContextValue = {
  conversations: BubbleConversation[];
  joinedBubbles: BubbleConversation[];
  loadingJoined: boolean;
  addBubbleConversation: (bubble: Bubble) => void;
  removeBubbleFromJoined: (conversationId: string) => void;
  refreshJoinedBubbles: () => Promise<void>;
  toggleStarred: (conversationId: string) => Promise<void>;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

function getMemberNames(bubble: Bubble): string[] {
  const names = bubble.participants?.length
    ? bubble.participants.map((p) => p.name)
    : [bubble.creator];
  return ["You", ...names];
}

function formatJoinedTime(iso?: string | null): string {
  if (!iso) return "Joined";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Joined";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function mineToConversation(b: MineBubble): BubbleConversation {
  const emoji = deriveEmoji(b.activity, b.emoji);
  const expired =
    b.status === "expired" ||
    (b.expires_at ? new Date(b.expires_at).getTime() < Date.now() : false);
  return {
    id: `bubble-${b.id}`,
    name: b.activity || "Bubble",
    avatar: emoji,
    lastMessage: expired ? "Bubble ended" : "Open group chat",
    time: formatJoinedTime(b.start_time),
    unread: 0,
    memberNames: ["You"],
    duration: b.duration_minutes ? `${b.duration_minutes} min` : undefined,
    joined: b.members_count ?? 0,
    zone: b.zone ?? undefined,
    starred: b.starred ?? false,
  };
}

function bubbleToConversation(bubble: Bubble): BubbleConversation {
  return {
    id: `bubble-${bubble.id}`,
    name: bubble.title,
    avatar: bubble.emoji,
    lastMessage: "You joined - say hi!",
    time: "Just now",
    unread: 0,
    memberNames: getMemberNames(bubble),
    duration: bubble.duration,
    participants: bubble.participants?.length
      ? bubble.participants
      : [{ id: "creator", name: bubble.creator, avatar: bubble.creatorAvatar }],
    joined: bubble.joined,
    zone: bubble.zone,
  };
}

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [joinedConversations, setJoinedConversations] = useState<BubbleConversation[]>([]);
  const [loadingJoined, setLoadingJoined] = useState(true);
  const fetchedRef = useRef(false);

  const mergeFromApi = useCallback((rows: MineBubble[]) => {
    const fromApi = rows.map(mineToConversation);
    setJoinedConversations((prev) => {
      const byId = new Map<string, BubbleConversation>();
      for (const c of fromApi) byId.set(c.id, c);
      // Keep optimistic local entries (e.g. just joined) if API lags
      for (const c of prev) {
        if (!byId.has(c.id)) byId.set(c.id, c);
      }
      return [...byId.values()].sort((a, b) => {
        // Prefer non-ended, then keep API order roughly by putting "Just now" first
        const aEnded = a.lastMessage === "Bubble ended" ? 1 : 0;
        const bEnded = b.lastMessage === "Bubble ended" ? 1 : 0;
        if (aEnded !== bEnded) return aEnded - bEnded;
        if (a.time === "Just now" && b.time !== "Just now") return -1;
        if (b.time === "Just now" && a.time !== "Just now") return 1;
        return 0;
      });
    });
  }, []);

  const refreshJoinedBubbles = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setJoinedConversations([]);
        setLoadingJoined(false);
        return;
      }
      const res = await fetch("/api/bubbles/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success && Array.isArray(json.data)) {
        mergeFromApi(json.data as MineBubble[]);
      }
    } catch {
      /* keep existing local state */
    } finally {
      setLoadingJoined(false);
    }
  }, [mergeFromApi]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refreshJoinedBubbles();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        refreshJoinedBubbles();
      }
      if (event === "SIGNED_OUT") {
        setJoinedConversations([]);
      }
    });

    const onFocus = () => {
      refreshJoinedBubbles();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshJoinedBubbles]);

  const addBubbleConversation = useCallback((bubble: Bubble) => {
    const next = bubbleToConversation(bubble);
    setJoinedConversations((prev) => {
      if (prev.some((c) => c.id === next.id)) {
        return prev.map((c) => (c.id === next.id ? { ...c, ...next, time: "Just now" } : c));
      }
      return [next, ...prev];
    });
  }, []);

  const removeBubbleFromJoined = useCallback((conversationId: string) => {
    setJoinedConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  // Per-person star: keeps this bubble in *your* conversations past the
  // 5-day auto-cleanup window without affecting anyone else's view of it
  // (see supabase/migrations/20260826_bubble_stars_and_cleanup.sql).
  // Optimistic - flips immediately, rolls back if the request fails.
  const toggleStarred = useCallback(async (conversationId: string) => {
    const bubbleId = conversationId.replace(/^bubble-/, "");
    const current = joinedConversations.find((c) => c.id === conversationId);
    const nextStarred = !current?.starred;

    setJoinedConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, starred: nextStarred } : c))
    );

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`/api/bubbles/${bubbleId}/star`, {
        method: nextStarred ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Star request failed");
    } catch {
      // Roll back on failure.
      setJoinedConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, starred: !nextStarred } : c))
      );
    }
  }, [joinedConversations]);

  const conversations: BubbleConversation[] = joinedConversations;
  const joinedBubbles = joinedConversations;

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        joinedBubbles,
        loadingJoined,
        addBubbleConversation,
        removeBubbleFromJoined,
        refreshJoinedBubbles,
        toggleStarred,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error("useConversations must be used within ConversationsProvider");
  }
  return ctx;
}
