"use client";

/**
 * CHAT PAGE
 * -----------------------------------------------------------------------------
 * Bubble chats: ensure membership → load history → Realtime for new messages.
 * Composer shows once YOU are a member (join succeeded). No more stuck
 * "waiting for 2" when the other person hasn't hit Join yet — we still poll
 * so the member count updates live.
 * -----------------------------------------------------------------------------
 */

import { use, useState, useEffect, useCallback } from "react";
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

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [bubbleInfo, setBubbleInfo] = useState<{ activity: string; members_count: number } | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const { conversations } = useConversations();
  const convo = conversations.find((c) => c.id === id);
  const isBubbleChat = id.startsWith("bubble-");
  const bubbleId = isBubbleChat ? id.replace(/^bubble-/, "") : "";
  const memberNames =
    isBubbleChat && convo && "memberNames" in convo
      ? (convo as { memberNames?: string[] }).memberNames
      : undefined;

  // Composer once current user is a member (after join). Don't gate on "2 people"
  // — that hid the input when a friend thought they joined but never hit Join.
  const chatUnlocked = !isBubbleChat || isMember;
  const showComposer = !isBubbleChat || (!bootstrapping && isMember && !messagesError);

  const refreshBubbleMeta = useCallback(async () => {
    if (!bubbleId) return;
    const res = await fetch(`/api/bubbles/${bubbleId}`);
    const d = await res.json().catch(() => ({}));
    if (d?.success && d.data) {
      setBubbleInfo({ activity: d.data.activity, members_count: d.data.members_count });
      setMemberCount(d.data.members_count);
    }
  }, [bubbleId]);

  const loadMessages = useCallback(async (token: string, uid: string) => {
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

      const res = await fetch(`/api/bubbles/${bubbleId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d?.success) {
        setMessagesError(
          res.status === 403
            ? "Join this bubble to see messages"
            : (d?.error ?? "Couldn't load messages")
        );
        setApiMessages([]);
        return;
      }
      setApiMessages(Array.isArray(d.data) ? d.data : []);
      setMessagesError(null);
      await refreshBubbleMeta();
    } catch {
      setMessagesError("Couldn't load messages");
    } finally {
      setMessagesLoading(false);
      setBootstrapping(false);
    }
  }, [bubbleId, refreshBubbleMeta]);

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
      if (!uid || !token) {
        setIsMember(false);
        setMessagesError("Sign in to chat");
        setBootstrapping(false);
        return;
      }
      await loadMessages(token, uid);
    })();
    return () => {
      cancelled = true;
    };
  }, [isBubbleChat, bubbleId, loadMessages, refreshBubbleMeta]);

  // Poll member count so header updates when a friend joins
  useEffect(() => {
    if (!isBubbleChat || !bubbleId || !isMember) return;
    const t = setInterval(() => {
      refreshBubbleMeta().catch(() => {});
    }, 4000);
    return () => clearInterval(t);
  }, [isBubbleChat, bubbleId, isMember, refreshBubbleMeta]);

  useEffect(() => {
    if (!isBubbleChat || !bubbleId || !isMember || messagesError) return;

    const channel = supabase
      .channel(`bubble-messages-${bubbleId}`)
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
          setApiMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isBubbleChat, bubbleId, isMember, messagesError, refreshBubbleMeta]);

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
      // Ensure membership first (same as messages API), then send
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
        setApiMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
        setMessage("");
        if (typeof data.members_count === "number") setMemberCount(data.members_count);
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
          time: new Date(m.created_at).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }),
        }))
      : chatUnlocked && !isBubbleChat
        ? mockMessages
        : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border z-40">
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

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto flex flex-col">
        {isBubbleChat && bootstrapping ? (
          <div className="flex justify-center pt-8">
            <p className="text-xs text-muted-foreground text-center">Opening chat…</p>
          </div>
        ) : isBubbleChat && !isMember && messagesError ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
            <div className="text-4xl" aria-hidden>
              🫧
            </div>
            <p className="text-sm font-medium text-foreground">{messagesError}</p>
            <button
              type="button"
              className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground"
              onClick={async () => {
                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;
                const uid = data.session?.user?.id;
                if (token && uid) {
                  setBootstrapping(true);
                  await loadMessages(token, uid);
                }
              }}
            >
              Join & retry
            </button>
          </div>
        ) : isBubbleChat && memberNames ? (
          <div className="flex justify-center pt-4">
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
          <div className="space-y-3 mt-2">
            {memberCount !== null && memberCount < 2 && (
              <p className="text-xs text-amber-500/90 text-center py-1">
                You can message now. Invite a friend — they must tap <strong>Join bubble</strong> to
                see the chat.
              </p>
            )}
            {messagesLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading messages…</p>
            ) : messagesToShow.length === 0 && isBubbleChat ? (
              <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hi!</p>
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
                    <p>{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"
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
        {!showComposer && <div className="flex-1" />}
      </div>

      {showComposer && (
        <div className="glass-strong border-t border-border">
          <div className="max-w-3xl mx-auto flex items-center gap-2 px-4 py-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
