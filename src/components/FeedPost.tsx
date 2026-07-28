"use client";

/**
 * FEED POST - Wander Moments card (dark theme, matches app chrome).
 */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FeedPost as FeedPostType, FeedComment } from "@/lib/mockData";
import { ProfileLink } from "@/components/ProfileLink";
import { Heart, MessageCircle, Share2, Send, MapPin } from "lucide-react";

type FeedPostProps = {
  post: FeedPostType;
};

export default function FeedPost({ post }: FeedPostProps) {
  const reduce = useReducedMotion();
  const activity =
    (post.activity?.trim() ||
      post.caption?.replace(/#\w+/g, "").trim() ||
      "Campus moment");
  const zone = post.zone && post.zone !== "-" ? post.zone : null;
  const participants = post.participants ?? [];
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>(post.comments ?? []);
  const [commentDraft, setCommentDraft] = useState("");
  const likeCount = (post.likes ?? 0) + (liked ? 1 : 0);
  // Strip duplicate brand hashtag from caption; we show it once below.
  const captionClean = (post.caption ?? "")
    .replace(/#wandermoment/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const captionIsRedundant =
    !!captionClean &&
    captionClean.toLowerCase() === activity.toLowerCase();

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${post.username} · ${activity}`,
          text: post.caption,
          url: window.location.href,
        })
        .catch(() => {});
    }
  };

  const handleAddComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, username: "You", text: trimmed },
    ]);
    setCommentDraft("");
  };

  return (
    <article
      className="rounded-3xl overflow-hidden mx-auto w-full max-w-md"
      style={{
        background: "linear-gradient(165deg, #1a1510 0%, #100c09 55%, #0a0806 100%)",
        border: "1px solid rgba(255,181,107,0.18)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px -16px rgba(0,0,0,0.7)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: "linear-gradient(145deg, rgba(255,122,26,0.35), rgba(255,122,26,0.12))",
              border: "1px solid rgba(255,181,107,0.35)",
              color: "#ffb56b",
            }}
          >
            {post.userAvatar}
          </div>
          <div className="min-w-0">
            <ProfileLink
              name={post.username}
              avatar={post.userAvatar}
              className="text-sm font-semibold block truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {post.username}
            </ProfileLink>
            <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>
              {post.timestamp}
              {zone ? ` · ${zone}` : ""}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: "rgba(255,122,26,0.12)",
            border: "1px solid rgba(255,122,26,0.28)",
            color: "#ffb56b",
          }}
        >
          Moment
        </span>
      </div>

      {/* Photo */}
      <div
        className="relative mx-4 aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          background: "linear-gradient(145deg, #0c0907, #1a120c)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {post.imageUrl ? (
          <motion.img
            src={post.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            initial={reduce ? { opacity: 0 } : { scale: 1.04, opacity: 0 }}
            whileInView={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="text-4xl" aria-hidden>
              📸
            </span>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              No photo yet
            </p>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{
            background: "linear-gradient(transparent, rgba(8,6,4,0.75))",
          }}
          aria-hidden
        />
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-2">
        <h3
          className="font-display text-[1.05rem] sm:text-lg font-bold leading-snug break-words text-balance"
          style={{ color: "var(--color-text-primary)" }}
          title={activity}
        >
          {activity}
        </h3>

        {(zone || participants.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {zone && (
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <MapPin className="w-3 h-3 shrink-0" style={{ color: "#ff7a1a" }} />
                <span className="break-words">{zone}</span>
              </span>
            )}
            {participants.length > 0 && (
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {participants.length} wanderer{participants.length === 1 ? "" : "s"} here
              </span>
            )}
          </div>
        )}

        {captionClean && !captionIsRedundant && (
          <p className="text-sm mt-2.5 leading-relaxed break-words" style={{ color: "var(--color-text-secondary)" }}>
            {captionClean}
          </p>
        )}

        {participants.length > 0 && (
          <p className="text-[11px] mt-2 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
            With {participants.map((p) => p.name).join(", ")}
          </p>
        )}

        <p
          className="mt-3 text-[11px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: "rgba(255,181,107,0.7)" }}
        >
          #wandermoment
        </p>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-5 px-4 py-3 mt-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          onClick={() => setLiked(!liked)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: liked ? "#f87171" : "var(--color-text-secondary)" }}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likeCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: showComments ? "#ff7a1a" : "var(--color-text-secondary)" }}
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs font-medium ml-auto transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="space-y-2 max-h-32 overflow-y-auto pt-3">
            {comments.length === 0 && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                No comments yet. Say something nice.
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="text-xs leading-relaxed">
                {c.username === "You" ? (
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {c.username}
                  </span>
                ) : (
                  <ProfileLink
                    name={c.username}
                    avatar={c.username.slice(0, 2).toUpperCase()}
                    className="font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {c.username}
                  </ProfileLink>
                )}{" "}
                <span style={{ color: "var(--color-text-secondary)" }}>{c.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add a comment…"
              className="flex-1 h-10 rounded-xl px-3 text-xs outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-text-primary)",
              }}
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!commentDraft.trim()}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                color: "#2a1206",
              }}
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
