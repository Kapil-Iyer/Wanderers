"use client";

/**
 * CHAT PAGE — live bubble chat with names, typing, Pepe emotes, pinned composer.
 */

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { mockMessages } from "@/lib/mockData";
import { useConversations } from "@/contexts/ConversationsContext";
import { ProfileLink } from "@/components/ProfileLink";
import { supabase } from "@/lib/supabase";
import { MessageContent } from "@/components/chat/MessageContent";
import EmotePicker from "@/components/chat/EmotePicker";
import { deriveEmoji } from "@/lib/bubbleMap";

type ApiMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string | null;
};

type TypingUser = { id: string; name: string; at: number };

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || "?").toUpperCase();
}

function isMissingName(name?: string | null): boolean {
  const n = (name ?? "").trim();
  return !n || n.toLowerCase() === "wanderer";
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("You");
  const [sending, setSending] = useState(false);
  const [bubbleInfo, setBubbleInfo] = useState<{ activity: string; members_count: number } | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [emoteOpen, setEmoteOpen] = useState(false);
  const { conversations, addBubbleConversation, refreshJoinedBubbles } = useConversations();
  const convo = conversations.find((c) => c.id === id);
  const isBubbleChat = id.startsWith("bubble-");
  const bubbleId = isBubbleChat ? id.replace(/^bubble-/, "") : "";
  const memberNames =
    isBubbleChat && convo && "memberNames" in convo
      ? (convo as { memberNames?: string[] }).memberNames
      : undefined;

  const scrollRef = useRef<HTMLDivElement>(null);
  const nameCacheRef = useRef<Map<string, string>>(new Map());
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);

  const chatUnlocked = !isBubbleChat || isMember;
  const showComposer = !isBubbleChat || (!bootstrapping && isMember && !messagesError);

  const goToMessages = useCallback(() => {
    refreshJoinedBubbles().catch(() => {});
    router.push("/messages");
  }, [router, refreshJoinedBubbles]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  }, []);

  const cacheName = useCallback((userId: string, name?: string | null) => {
    if (!userId || isMissingName(name)) return;
    nameCacheRef.current.set(userId, name!.trim());
  }, []);

  const resolveName = useCallback(
    (userId: string, senderName?: string | null) => {
      if (userId === currentUserId) return "You";
      if (!isMissingName(senderName)) return senderName!.trim();
      const cached = nameCacheRef.current.get(userId);
      if (cached && !isMissingName(cached)) return cached;
      return "Wanderer";
    },
    [currentUserId]
  );

  const mergeMessages = useCallback(
    (incoming: ApiMessage[]) => {
      if (!incoming.length) return;
      for (const m of incoming) cacheName(m.user_id, m.sender_name);
      setApiMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        let changed = false;
        for (const m of incoming) {
          const existing = byId.get(m.id);
          const betterName = !isMissingName(m.sender_name)
            ? m.sender_name!.trim()
            : nameCacheRef.current.get(m.user_id);
          if (!existing) {
            byId.set(m.id, {
              ...m,
              sender_name: betterName || m.sender_name || "Wanderer",
            });
            changed = true;
          } else {
            const nextName =
              (!isMissingName(m.sender_name) && m.sender_name!.trim()) ||
              (!isMissingName(existing.sender_name) && existing.sender_name!.trim()) ||
              betterName ||
              existing.sender_name;
            if (nextName !== existing.sender_name || m.content !== existing.content) {
              byId.set(m.id, { ...existing, ...m, sender_name: nextName });
              changed = true;
            }
          }
        }
        if (!changed) return prev;
        return [...byId.values()].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    [cacheName]
  );

  const refreshBubbleMeta = useCallback(async () => {
    if (!bubbleId) return;
    const res = await fetch(`/api/bubbles/${bubbleId}`);
    const d = await res.json().catch(() => ({}));
    if (d?.success && d.data) {
      setBubbleInfo({ activity: d.data.activity, members_count: d.data.members_count });
      setMemberCount(d.data.members_count);
    }
  }, [bubbleId]);

  const fetchMessages = useCallback(
    async (token: string) => {
      if (!bubbleId) return null;
      const res = await fetch(`/api/bubbles/${bubbleId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d?.success) return { ok: false as const, status: res.status, error: d?.error };
      return { ok: true as const, data: (Array.isArray(d.data) ? d.data : []) as ApiMessage[] };
    },
    [bubbleId]
  );

  const loadMessages = useCallback(
    async (token: string, uid: string) => {
      if (!bubbleId) return;
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const joinRes = await fetch("/api/bubbles/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bubble_id: bubbleId }),
        });
        const joinData = await joinRes.json().catch(() => ({}));

        if (!joinRes.ok || !joinData?.success) {
          setIsMember(false);
          setMessagesError(joinData?.error ?? "Couldn't join this bubble");
          setApiMessages([]);
          return;
        }

        setIsMember(true);
        if (typeof joinData?.data?.members_count === "number") {
          setMemberCount(joinData.data.members_count);
        }
        setCurrentUserId(uid);

        // Keep Messages list in sync (Back should show this bubble)
        let activityTitle = "Bubble";
        try {
          const metaRes = await fetch(`/api/bubbles/${bubbleId}`);
          const meta = await metaRes.json().catch(() => ({}));
          if (meta?.success && meta.data?.activity) {
            activityTitle = meta.data.activity;
            setBubbleInfo({
              activity: meta.data.activity,
              members_count: meta.data.members_count ?? joinData?.data?.members_count ?? 1,
            });
            if (typeof meta.data.members_count === "number") {
              setMemberCount(meta.data.members_count);
            }
          }
        } catch {
          /* ignore */
        }
        addBubbleConversation({
          id: bubbleId,
          title: activityTitle,
          emoji: deriveEmoji(activityTitle),
          creator: "You",
          creatorAvatar: "YU",
          category: "Casual",
          zone: "",
          distance: "",
          startingIn: "Now",
          duration: "1 hr",
          description: "",
          joined: joinData?.data?.members_count ?? 1,
          maxPeople: 8,
          participants: [],
        });
        refreshJoinedBubbles().catch(() => {});

        const result = await fetchMessages(token);
        if (!result || !result.ok) {
          setMessagesError(
            result?.status === 403
              ? "Join this bubble to see messages"
              : (result?.error ?? "Couldn't load messages")
          );
          setApiMessages([]);
          return;
        }
        mergeMessages(result.data);
        setMessagesError(null);
        await refreshBubbleMeta();
        scrollToBottom(false);
      } catch {
        setMessagesError("Couldn't load messages");
      } finally {
        setMessagesLoading(false);
        setBootstrapping(false);
      }
    },
    [
      bubbleId,
      fetchMessages,
      mergeMessages,
      refreshBubbleMeta,
      scrollToBottom,
      addBubbleConversation,
      refreshJoinedBubbles,
    ]
  );

  useEffect(() => {
    if (!isBubbleChat || !bubbleId) {
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    setBootstrapping(true);
    (async () => {
      await refreshBubbleMeta();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const uid = data.session?.user?.id ?? null;
      const token = data.session?.access_token;
      const user = data.session?.user;
      if (!uid || !token) {
        setIsMember(false);
        setMessagesError("Sign in to chat");
        setBootstrapping(false);
        return;
      }
      const metaName =
        (typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
        (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
        user?.email?.split("@")[0] ||
        "You";
      setCurrentUserName(metaName);
      nameCacheRef.current.set(uid, metaName);
      await loadMessages(token, uid);
    })();
    return () => {
      cancelled = true;
    };
  }, [isBubbleChat, bubbleId, loadMessages, refreshBubbleMeta]);

  useEffect(() => {
    if (!isBubbleChat || !bubbleId || !isMember || messagesError) return;
    const tick = async () => {
      refreshBubbleMeta().catch(() => {});
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const result = await fetchMessages(token);
      if (result?.ok) mergeMessages(result.data);
    };
    const t = setInterval(tick, 2500);
    return () => clearInterval(t);
  }, [isBubbleChat, bubbleId, isMember, messagesError, refreshBubbleMeta, fetchMessages, mergeMessages]);

  useEffect(() => {
    if (!isBubbleChat || !bubbleId || !isMember || messagesError) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) await supabase.realtime.setAuth(token);
      if (cancelled) return;

      channel = supabase.channel(`bubble-chat-${bubbleId}`, {
        config: { broadcast: { self: false } },
      });
      typingChannelRef.current = channel;

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `bubble_id=eq.${bubbleId}`,
          },
          (payload) => {
            const row = payload.new as ApiMessage;
            if (!row?.id) return;
            mergeMessages([
              {
                ...row,
                sender_name: row.sender_name ?? nameCacheRef.current.get(row.user_id) ?? null,
              },
            ]);
            scrollToBottom(true);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bubble_members",
            filter: `bubble_id=eq.${bubbleId}`,
          },
          () => {
            refreshBubbleMeta().catch(() => {});
          }
        )
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          const p = payload as { user_id?: string; name?: string } | null;
          if (!p?.user_id || p.user_id === currentUserId) return;
          const name = p.name?.trim() || nameCacheRef.current.get(p.user_id) || "Someone";
          cacheName(p.user_id, name);
          setTypingUsers((prev) => {
            const next = prev.filter((u) => u.id !== p.user_id);
            next.push({ id: p.user_id!, name, at: Date.now() });
            return next;
          });
          // Upgrade any "Wanderer" labels for this user in the thread
          setApiMessages((prev) => {
            let changed = false;
            const next = prev.map((m) => {
              if (m.user_id !== p.user_id || !isMissingName(m.sender_name)) return m;
              changed = true;
              return { ...m, sender_name: name };
            });
            return changed ? next : prev;
          });
        })
        .subscribe();
    })();

    return () => {
      cancelled = true;
      typingChannelRef.current = null;
      if (channel) supabase.removeChannel(channel);
    };
  }, [
    isBubbleChat,
    bubbleId,
    isMember,
    messagesError,
    currentUserId,
    refreshBubbleMeta,
    mergeMessages,
    scrollToBottom,
    cacheName,
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      const cutoff = Date.now() - 3000;
      setTypingUsers((prev) => {
        const next = prev.filter((u) => u.at > cutoff);
        return next.length === prev.length ? prev : next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (apiMessages.length) scrollToBottom(true);
  }, [apiMessages.length, scrollToBottom]);

  const broadcastTyping = useCallback(() => {
    if (!currentUserId || !typingChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 900) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId, name: currentUserName },
    });
  }, [currentUserId, currentUserName]);

  const handleSend = async (override?: string) => {
    const content = (override ?? message).trim();
    if (!content || !isBubbleChat || !bubbleId || sending) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    const uid = session?.session?.user?.id ?? null;
    if (!token || !uid) {
      toast.error("Sign in to send messages");
      return;
    }
    setSending(true);
    setCurrentUserId(uid);
    try {
      await fetch("/api/bubbles/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bubble_id: bubbleId }),
      });

      const res = await fetch(`/api/bubbles/${bubbleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.data) {
        setIsMember(true);
        mergeMessages([data.data as ApiMessage]);
        setMessage("");
        setEmoteOpen(false);
        if (typeof data.members_count === "number") setMemberCount(data.members_count);
        scrollToBottom(true);
        return;
      }
      toast.error(data?.error ?? `Couldn't send (${res.status})`);
    } catch {
      toast.error("Couldn't send message");
    } finally {
      setSending(false);
    }
  };

  const messagesToShow =
    isBubbleChat && chatUnlocked && apiMessages.length > 0
      ? apiMessages.map((m) => ({
          id: m.id,
          text: m.content,
          sender: (m.user_id === currentUserId ? "me" : "other") as "me" | "other",
          name: resolveName(m.user_id, m.sender_name),
          time: new Date(m.created_at).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }),
        }))
      : chatUnlocked && !isBubbleChat
        ? mockMessages.map((m) => ({ ...m, name: m.sender === "me" ? "You" : "Friend" }))
        : [];

  const typingLabel = (() => {
    const names = typingUsers.map((u) => u.name);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `${names[0]} and ${names.length - 1} others are typing…`;
  })();

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden p-3 sm:p-5"
      style={{ background: "linear-gradient(180deg, #0e0a07 0%, #16110c 50%, #0c0907 100%)" }}
    >
      {/* 3D chat window frame */}
      <div
        className="flex-1 min-h-0 w-full max-w-3xl mx-auto flex flex-col relative rounded-[18px]"
        style={{
          background: `
            linear-gradient(145deg, #2a221a 0%, #14100c 22%, #0c0907 78%, #080604 100%)
            padding-box,
            linear-gradient(145deg, #9a7b55 0%, #4a3828 28%, #1a140f 62%, #6b5338 100%)
            border-box
          `,
          backgroundClip: "padding-box, border-box",
          border: "3px solid transparent",
          boxShadow: [
            "0 1px 0 rgba(255,210,160,0.18) inset",
            "3px 3px 0 rgba(255,255,255,0.06) inset",
            "-3px -3px 0 rgba(0,0,0,0.55) inset",
            "0 18px 48px -12px rgba(0,0,0,0.75)",
            "0 4px 12px rgba(0,0,0,0.45)",
          ].join(", "),
        }}
      >
        {/* Inner metallic rim */}
        <div
          className="pointer-events-none absolute inset-[4px] rounded-[14px] z-20"
          style={{
            border: "1px solid rgba(201,160,106,0.28)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.45) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex-1 min-h-0 flex flex-col rounded-[15px] overflow-hidden m-[5px]">
          <header
            className="shrink-0 z-40"
            style={{
              background: "rgba(18,13,10,0.96)",
              borderBottom: "1px solid rgba(255,122,26,0.12)",
            }}
          >
            <div className="flex items-center gap-3 px-3 sm:px-4 h-14">
              <button
                type="button"
                onClick={goToMessages}
                aria-label="Back to messages"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-secondary)" }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{
                  background: "rgba(255,122,26,0.15)",
                  border: "1px solid rgba(255,122,26,0.25)",
                }}
              >
                {(convo?.avatar?.length ?? 0) <= 2 ? (
                  <span className="text-[10px] font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {convo?.avatar ?? "🫧"}
                  </span>
                ) : (
                  convo?.avatar ?? "🫧"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="font-semibold text-sm block truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {convo?.name ?? bubbleInfo?.activity ?? "Group chat"}
                </span>
                {isBubbleChat && memberCount !== null && (
                  <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                    {memberCount < 2 ? " · waiting for others" : ""}
                  </span>
                )}
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 min-h-0 w-full px-3 sm:px-4 py-4 overflow-y-auto overflow-x-hidden"
            style={{ background: "rgba(12,9,7,0.92)" }}
          >
            {isBubbleChat && bootstrapping ? (
              <div className="flex justify-center pt-8">
                <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                  Opening chat…
                </p>
              </div>
            ) : isBubbleChat && !isMember && messagesError ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 px-6 text-center">
                <div className="text-4xl" aria-hidden>
                  🫧
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {messagesError}
                </p>
                {/sign in/i.test(messagesError) && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", color: "#2a1206" }}
                    onClick={() => router.push("/")}
                  >
                    Go to sign in
                  </button>
                )}
              </div>
            ) : (
              <>
                {isBubbleChat && memberNames ? (
                  <div className="flex justify-center pt-1 pb-4">
                    <p
                      className="text-xs text-center max-w-[280px] px-3 py-1.5 rounded-full"
                      style={{
                        color: "var(--color-text-muted)",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      Group chat with{" "}
                      {memberNames.map((name, i) => (
                        <span key={name}>
                          {i > 0 && ", "}
                          {name === "You" ? (
                            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                              You
                            </span>
                          ) : (
                            <ProfileLink
                              name={name}
                              className="font-medium"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {name}
                            </ProfileLink>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : null}

                {showComposer && (
                  <div className="space-y-3.5 pb-2">
                    {memberCount !== null && memberCount < 2 && (
                      <p className="text-xs text-center py-1" style={{ color: "rgba(255,181,107,0.9)" }}>
                        You can message now. Invite a friend — they must tap{" "}
                        <strong>Join bubble</strong> to see the chat.
                      </p>
                    )}
                    {messagesLoading ? (
                      <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                        Loading messages…
                      </p>
                    ) : messagesToShow.length === 0 && isBubbleChat ? (
                      <p className="text-xs text-center py-8" style={{ color: "var(--color-text-muted)" }}>
                        No messages yet. Say hi!
                      </p>
                    ) : (
                      messagesToShow.map((msg) => {
                        const mine = msg.sender === "me";
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}
                          >
                            {!mine && (
                              <div
                                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                                style={{
                                  background: "rgba(255,122,26,0.12)",
                                  border: "1px solid rgba(255,122,26,0.22)",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {initialsFrom(msg.name)}
                              </div>
                            )}
                            <div
                              className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}
                            >
                              <p
                                className={`text-[11px] font-semibold mb-1 px-1 ${mine ? "text-right" : "text-left"}`}
                                style={{
                                  color: mine ? "rgba(255,181,107,0.85)" : "var(--color-text-secondary)",
                                }}
                              >
                                {msg.name}
                              </p>
                              <div
                                className={`px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                                  mine ? "rounded-br-md" : "rounded-bl-md"
                                }`}
                                style={
                                  mine
                                    ? {
                                        background: "linear-gradient(135deg, #ff7a1a, #e86a10)",
                                        color: "#2a1206",
                                        boxShadow: "0 4px 14px rgba(255,122,26,0.28)",
                                      }
                                    : {
                                        background: "rgba(255,255,255,0.07)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        color: "var(--color-text-primary)",
                                      }
                                }
                              >
                                <MessageContent text={msg.text} />
                                <p
                                  className="text-[10px] mt-1.5"
                                  style={{
                                    color: mine ? "rgba(42,18,6,0.55)" : "var(--color-text-muted)",
                                  }}
                                >
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {showComposer && (
            <div
              className="shrink-0 relative pb-[env(safe-area-inset-bottom)]"
              style={{
                background: "rgba(16,12,9,0.98)",
                borderTop: "1px solid rgba(255,122,26,0.12)",
              }}
            >
              <EmotePicker
                open={emoteOpen}
                onClose={() => setEmoteOpen(false)}
                onPick={(code) => {
                  setMessage((prev) => (prev ? `${prev} ${code}` : code));
                  broadcastTyping();
                }}
              />
              {typingLabel && (
                <p
                  className="px-4 pt-2 text-[11px] truncate"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {typingLabel}
                </p>
              )}
              <div className="flex items-end gap-2 px-3 py-3">
                <button
                  type="button"
                  aria-label="Pepe emotes"
                  onClick={() => setEmoteOpen((o) => !o)}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: emoteOpen ? "rgba(255,122,26,0.2)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: emoteOpen ? "#ffb56b" : "var(--color-text-secondary)",
                  }}
                >
                  <Smile className="w-4 h-4" />
                </button>
                <div
                  className="flex-1 flex items-center rounded-2xl px-1"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Input
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (e.target.value.trim()) broadcastTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && isBubbleChat) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Message…"
                    className="flex-1 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={sending || !message.trim()}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                    color: "#2a1206",
                    boxShadow: "0 4px 14px rgba(255,122,26,0.35)",
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
