"use client";

/**
 * FEED POST - "Wander Moments" / meetup proof
 * -----------------------------------------------------------------------------
 * Moments = proof of meetup.
 * Shows: photo, activity, zone, timestamp, caption, participants, like/comment/share.
 * -----------------------------------------------------------------------------
 */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FeedPost as FeedPostType, FeedComment } from "@/lib/mockData";
import { ProfileLink } from "@/components/ProfileLink";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";

type FeedPostProps = {
  post: FeedPostType;
};

export default function FeedPost({ post }: FeedPostProps) {
  const reduce = useReducedMotion();
  const activity = post.activity ?? post.caption?.split("#")[0]?.trim() ?? "Activity";
  const zone = post.zone ?? "—";
  const participants = post.participants ?? [];
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>(post.comments ?? []);
  const [commentDraft, setCommentDraft] = useState("");
  const likeCount = (post.likes ?? 0) + (liked ? 1 : 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${post.username} — ${activity}`,
        text: post.caption,
        url: window.location.href,
      }).catch(() => {});
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
    <article className="bg-card border-b border-border flex flex-col items-center py-3">
      <div className="w-full max-w-[28rem] mx-auto px-3">
        {/* Header: user + activity | zone */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
              {post.userAvatar}
            </div>
            <ProfileLink name={post.username} avatar={post.userAvatar} className="text-xs font-semibold text-foreground">
              {post.username}
            </ProfileLink>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{activity}</p>
            <p className="text-[10px] text-muted-foreground">{zone}</p>
          </div>
        </div>

        {/* Photo — the black frame is always solid; only the photo itself snaps into place */}
        <div className="w-full max-h-[55vh] aspect-square bg-black flex items-center justify-center rounded-2xl overflow-hidden">
          {post.imageUrl ? (
            <motion.img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-contain"
              initial={reduce ? { opacity: 0 } : { scale: 0.92, opacity: 0, filter: "blur(10px)" }}
              whileInView={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
            />
          ) : (
            <span className="text-3xl text-muted-foreground/50">📷</span>
          )}
        </div>

        {/* Caption + participants + timestamp */}
        <div className="py-2 space-y-1">
          <p className="text-xs text-foreground">{post.caption}</p>
          {participants.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              With {participants.map((p) => p.name).join(", ")}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">{post.timestamp}</p>
        </div>

        {/* Like, Comment, Share */}
        <div className="flex items-center gap-6 py-2 border-t border-border">
          <button
            type="button"
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-xs">{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 transition-colors ${showComments ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{comments.length}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="text-xs">
                  {c.username === "You" ? (
                    <span className="font-semibold text-foreground">{c.username}</span>
                  ) : (
                    <ProfileLink name={c.username} avatar={c.username.slice(0, 2).toUpperCase()} className="font-semibold text-foreground">
                      {c.username}
                    </ProfileLink>
                  )}
                  {" "}
                  <span className="text-foreground">{c.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!commentDraft.trim()}
                className="shrink-0 w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                aria-label="Post comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
