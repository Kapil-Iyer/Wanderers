"use client";

/**
 * END EVENT MODAL - Two-step flow
 * -----------------------------------------------------------------------------
 * Card 1: Take picture, caption, Save to device | End event (confirm bubble)
 * Card 2: People you hung out with + "Wanna wander?" (connect request)
 * Photo upload to remote storage is disabled — local preview / save only.
 * -----------------------------------------------------------------------------
 */

import { useRef, useState } from "react";
import { ArrowLeft, Camera, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { BubbleConversation } from "@/contexts/ConversationsContext";
import { useConnections } from "@/contexts/ConnectionsContext";
import { getProfileByName, getOrCreateProfile } from "@/lib/mockData";
import type { FeedPost } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileLink } from "@/components/ProfileLink";
import { supabase } from "@/lib/supabase";

type EndEventModalProps = {
  bubble: BubbleConversation;
  onClose: () => void;
  onAddPost: (post: Omit<FeedPost, "id" | "timestamp"> & { imageUrl?: string }) => void;
};

export default function EndEventModal({ bubble, onClose, onAddPost }: EndEventModalProps) {
  const { addPendingRequest, isConnected, isPending } = useConnections();
  const [step, setStep] = useState<"photo" | "people">("photo");
  const [caption, setCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<"polaroid" | "grayscale" | "sepia" | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participants = bubble.participants ?? [];
  const others = participants.filter((p) => p.name !== "You");

  const handleTakePicture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setPhotoUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleSaveToDevice = () => {
    if (photoUrl) {
      const a = document.createElement("a");
      a.href = photoUrl;
      a.download = `moment-${bubble.name.replace(/\s+/g, "-")}.jpg`;
      a.click();
    }
    setStep("people");
  };

  const handleSaveAndPost = async () => {
    const bubbleId = bubble.id.replace(/^bubble-/, "");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    setPosting(true);
    try {
      // End event without remote photo upload (media upload disabled).
      if (token) {
        const confirmRes = await fetch(`/api/bubbles/${bubbleId}/confirm`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!confirmRes.ok) {
          const errBody = await confirmRes.json().catch(() => ({}));
          const msg = errBody?.error || confirmRes.statusText;
          if (confirmRes.status === 403) {
            toast.error(
              "You're not a member of this bubble. Join the bubble from the chat first, then end the event."
            );
          } else {
            toast.error(msg || "Event could not be ended.");
          }
          return;
        }
      }

      const participants = bubble.participants ?? [];
      onAddPost({
        username: "you",
        userAvatar: "YU",
        activity: bubble.name,
        zone: bubble.zone ?? "—",
        participants: participants.map((p) => ({ name: p.name, avatar: p.avatar })),
        caption: caption.trim() || `${bubble.name} 💫`,
        ...(photoUrl ? { imageUrl: photoUrl } : {}),
      });
      toast.success("Event ended");
      setStep("people");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const handleWannaWander = (name: string, avatar: string) => {
    const profile = getProfileByName(name, avatar) ?? getOrCreateProfile(name, avatar);
    if (!isConnected(profile.id) && !isPending(profile.id)) {
      addPendingRequest(profile.id);
    }
  };

  const renderCard = () => {
    if (step === "photo") {
      return (
        <>
          <header className="flex items-center gap-3 px-6 lg:px-8 h-16 border-b border-border shrink-0">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Capture the moment</h1>
          </header>
          <div className="flex flex-col justify-start p-6 sm:p-8 gap-0 overflow-y-auto shrink-0">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleTakePicture}
                className={`w-full max-w-md h-72 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors shrink-0 ${
                  photoUrl
                    ? "bg-muted/50 border-2 border-border overflow-hidden"
                    : "bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                }`}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Your moment"
                    className="w-full h-full object-cover transition-[filter] duration-200"
                    style={{
                      filter:
                        filter === "grayscale"
                          ? "grayscale(100%)"
                          : filter === "sepia"
                            ? "sepia(100%)"
                            : "none",
                    }}
                  />
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-muted-foreground" />
                    <span className="text-base text-muted-foreground">Take Picture</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setFilter(filter === "polaroid" ? null : "polaroid")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === "polaroid" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                Polaroid
              </button>
              <button
                type="button"
                onClick={() => setFilter(filter === "grayscale" ? null : "grayscale")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === "grayscale" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                Grayscale
              </button>
              <button
                type="button"
                onClick={() => setFilter(filter === "sepia" ? null : "sepia")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === "sepia" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                Sepia
              </button>
            </div>
            <div className="space-y-1.5 mt-1">
              <Label htmlFor="caption" className="text-base">Caption</Label>
              <Input
                id="caption"
                placeholder="What happened?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="rounded-xl h-12 text-base"
              />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl gap-2 h-12 text-base"
                onClick={handleSaveToDevice}
              >
                <Download className="w-5 h-5" />
                Save to device
              </Button>
              <Button
                size="lg"
                className="w-full rounded-xl gap-2 h-12 text-base"
                onClick={handleSaveAndPost}
                disabled={posting}
              >
                <Share2 className="w-5 h-5" />
                {posting ? "Posting…" : "Save and post"}
              </Button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <header className="flex items-center gap-3 px-6 lg:px-8 h-16 border-b border-border shrink-0">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Future Wanderers?</h1>
        </header>
        <div className="overflow-y-auto max-h-[70vh] p-6 sm:p-8 space-y-3">
          {others.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other participants</p>
          ) : (
            others.map((p) => {
              const profile = getProfileByName(p.name, p.avatar) ?? getOrCreateProfile(p.name, p.avatar);
              const connected = isConnected(profile.id);
              const pending = isPending(profile.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-background/60 border border-border"
                >
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shrink-0">
                    {p.avatar}
                  </div>
                  <ProfileLink name={p.name} avatar={p.avatar} className="text-base font-medium text-foreground flex-1 min-w-0 truncate block text-left">
                    {p.name}
                  </ProfileLink>
                  {connected ? (
                    <span className="text-xs text-muted-foreground shrink-0">Connected</span>
                  ) : pending ? (
                    <span className="text-xs text-muted-foreground shrink-0">Pending</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-xl text-xs"
                      onClick={() => handleWannaWander(p.name, p.avatar)}
                    >
                      Wanna Wander?
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 backdrop-blur-[2px] bg-background/5"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative z-10 w-full max-w-2xl sm:max-w-3xl max-h-[95vh] rounded-3xl overflow-hidden bg-card border border-border/50 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {renderCard()}
      </div>
    </div>
  );
}
