"use client";

/**
 * CHAT PAGE
 * -----------------------------------------------------------------------------
 * Bubble chats: ensure membership → load history → live updates (Realtime +
 * poll fallback) → typing broadcast. Composer stays pinned at the bottom.
 * -----------------------------------------------------------------------------
 */

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { mockMessages } from "@/lib/mockData";
import { useConversations } from "@/contexts/ConversationsContext";
import { ProfileLink } from "@/components/ProfileLink";
import { supabase } from "@/lib/supabase";

type ApiMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string | null;
};

type TypingUser = { id: string; name: string; at: number };

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
  const { conversations } = useConversations();
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

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  }, []);

  const mergeMessages = useCallback((incoming: ApiMessage[]) => {
    if (!incoming.length) return;
    for (const m of incoming) {
      if (m.user_id && m.sender_name) nameCacheRef.current.set(m.user_id, m.sender_name);
    }
    setApiMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      let changed = false;
      for (const m of incoming) {
        const existing = byId.get(m.id);
        if (!existing) {
          byId.set(m.id, {
            ...m,
            sender_name: m.sender_name ?? nameCacheRef.current.get(m.user_id) ?? "Wanderer",
          });
          changed = true;
        } else if (!existing.sender_name && m.sender_name) {
          byId.set(m.id, { ...existing, sender_name: m.sender_name });
          changed = true;
        }
      }
      if (!changed) return prev;
      return [...byId.values()].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

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
    [bubbleId, fetchMessages, mergeMessages, refreshBubbleMeta, scrollToBottom]
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

  // Poll member count + messages (Realtime can miss under RLS; poll keeps chat live)
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

  // Realtime inserts + typing broadcast
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
                sender_name: row.sender_name ?? nameCacheRef.current.get(row.user_id) ?? "Wanderer",
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
          nameCacheRef.current.set(p.user_id, name);
          setTypingUsers((prev) => {
            const next = prev.filter((u) => u.id !== p.user_id);
            next.push({ id: p.user_id!, name, at: Date.now() });
            return next;
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
  ]);

  // Expire stale typing indicators
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

  const handleSend = async () => {
    const content = message.trim();
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
          name:
            m.user_id === currentUserId
              ? "You"
              : m.sender_name || nameCacheRef.current.get(m.user_id) || "Wanderer",
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
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 bg-card border-b border-border z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm">
            {(convo?.avatar?.length ?? 0) <= 2 ? (
              <span className="text-[10px] font-bold text-accent-foreground">
                {convo?.avatar ?? "🫧"}
              </span>
            ) : (
              convo?.avatar ?? "🫧"
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-sm text-foreground block truncate">
              {convo?.name ?? bubbleInfo?.activity ?? "Group chat"}
            </span>
            {isBubbleChat && memberCount !== null && (
              <span className="text-[11px] text-muted-foreground">
                {memberCount} member{memberCount === 1 ? "" : "s"}
                {memberCount < 2 ? " · waiting for others" : ""}
              </span>
            )}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto overflow-x-hidden"
      >
        {isBubbleChat && bootstrapping ? (
          <div className="flex justify-center pt-8">
            <p className="text-xs text-muted-foreground text-center">Opening chat…</p>
          </div>
        ) : isBubbleChat && !isMember && messagesError ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 px-6 text-center">
            <div className="text-4xl" aria-hidden>
              🫧
            </div>
            <p className="text-sm font-medium text-foreground">{messagesError}</p>
            {/sign in/i.test(messagesError) && (
              <button
                type="button"
                className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground"
                onClick={() => router.push("/")}
              >
                Go to sign in
              </button>
            )}
          </div>
        ) : (
          <>
            {isBubbleChat && memberNames ? (
              <div className="flex justify-center pt-2 pb-3">
                <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                  Group chat with{" "}
                  {memberNames.map((name, i) => (
                    <span key={name}>
                      {i > 0 && ", "}
                      {name === "You" ? (
                        <span className="text-foreground font-medium">You</span>
                      ) : (
                        <ProfileLink name={name} className="text-foreground font-medium">
                          {name}
                        </ProfileLink>
                      )}
                    </span>
                  ))}
                </p>
              </div>
            ) : null}

            {showComposer && (
              <div className="space-y-3">
                {memberCount !== null && memberCount < 2 && (
                  <p className="text-xs text-amber-500/90 text-center py-1">
                    You can message now. Invite a friend — they must tap <strong>Join bubble</strong>{" "}
                    to see the chat.
                  </p>
                )}
                {messagesLoading ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Loading messages…</p>
                ) : messagesToShow.length === 0 && isBubbleChat ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No messages yet. Say hi!
                  </p>
                ) : (
                  messagesToShow.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.sender === "me"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-semibold mb-0.5 ${
                            msg.sender === "me"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.name}
                        </p>
                        <p>{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender === "me"
                              ? "text-primary-foreground/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showComposer && (
        <div className="shrink-0 glass-strong border-t border-border pb-[env(safe-area-inset-bottom)]">
          {typingLabel && (
            <p className="max-w-3xl mx-auto px-4 pt-2 text-[11px] text-muted-foreground truncate">
              {typingLabel}
            </p>
          )}
          <div className="max-w-3xl mx-auto flex items-center gap-2 px-4 py-3">
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
              placeholder="Type a message..."
              className="flex-1 h-10 rounded-full"
            />
            <button
              type="button"
              onClick={isBubbleChat ? handleSend : undefined}
              disabled={sending || (isBubbleChat && !message.trim())}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
