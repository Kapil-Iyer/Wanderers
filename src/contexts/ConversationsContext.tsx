"use client";

/**
 * =============================================================================
 * CONVERSATIONS CONTEXT - API INTEGRATION REFERENCE
 * =============================================================================
 * Manages: chat conversations list, joined bubbles (when user joins from map).
 *
 * CURRENT: Uses mockConversations + local joinedConversations state.
 *
 * API INTEGRATION POINTS:
 * - conversations       → GET /api/conversations or Supabase messages
 * - joinedBubbles       → GET /api/users/me/bubbles or bubble_members
 * - addBubbleConversation() → POST /api/bubbles/:id/join (bubble_members)
 * - mockConversations   → Replace with real conversation/chat API
 * =============================================================================
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { Conversation } from "@/lib/mockData";
import type { Bubble, BubbleParticipant } from "@/lib/mockData";

export type BubbleConversation = Conversation & {
  memberNames?: string[];
  duration?: string;
  zone?: string;
  participants?: BubbleParticipant[];
  joined?: number; // member count — chat unlocks at 2
};

type ConversationsContextValue = {
  conversations: BubbleConversation[];
  joinedBubbles: BubbleConversation[];
  addBubbleConversation: (bubble: Bubble) => void;
  removeBubbleFromJoined: (conversationId: string) => void;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

function getMemberNames(bubble: Bubble): string[] {
  const names = bubble.participants?.length
    ? bubble.participants.map((p) => p.name)
    : [bubble.creator];
  return ["You", ...names];
}

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [joinedConversations, setJoinedConversations] = useState<BubbleConversation[]>([]);

  const addBubbleConversation = useCallback((bubble: Bubble) => {
    const id = `bubble-${bubble.id}`;
    setJoinedConversations((prev) => {
      if (prev.some((c) => c.id === id)) return prev;
      return [
        ...prev,
        {
          id,
          name: bubble.title,
          avatar: bubble.emoji,
          lastMessage: "You joined — say hi!",
          time: "Just now",
          unread: 0,
          memberNames: getMemberNames(bubble),
          duration: bubble.duration,
          participants: bubble.participants?.length
            ? bubble.participants
            : [{ id: "creator", name: bubble.creator, avatar: bubble.creatorAvatar }],
          joined: bubble.joined, // caller passes post-join count; do not +1 again
          zone: bubble.zone,
        },
      ];
    });
  }, []);

  const removeBubbleFromJoined = useCallback((conversationId: string) => {
    setJoinedConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  // Only real bubbles you joined — no fake preset chats
  const conversations: BubbleConversation[] = joinedConversations;
  const joinedBubbles = joinedConversations;

  return (
    <ConversationsContext.Provider value={{ conversations, joinedBubbles, addBubbleConversation, removeBubbleFromJoined }}>
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
