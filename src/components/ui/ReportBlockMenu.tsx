"use client";

/**
 * Report/Block affordance for anything posted by another user - a chat
 * message, a Wander Moment photo, or a profile/connection card. Reused
 * across all three rather than building bespoke menus each time.
 */

import { useState } from "react";
import { MoreVertical, Flag, Ban } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Props = {
  /** The user who posted this content - who gets reported/blocked. */
  targetUserId: string;
  targetUserName?: string;
  reportTargetType: "message" | "photo" | "user";
  /** id of the specific message/photo/user being reported. */
  reportTargetId: string;
  onBlocked?: () => void;
  className?: string;
};

export function ReportBlockMenu({
  targetUserId,
  targetUserName,
  reportTargetType,
  reportTargetId,
  onBlocked,
  className,
}: Props) {
  const [dialog, setDialog] = useState<"report" | "block" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const name = targetUserName?.trim() || "this user";

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          target_type: reportTargetType,
          target_id: reportTargetId,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error ?? "Report failed");
      toast.success("Thanks - we'll take a look.");
      setDialog(null);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBlock = async () => {
    setSubmitting(true);
    try {
      const headers = await authHeader();
      const res = await fetch(`/api/blocks/${targetUserId}`, {
        method: "POST",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error ?? "Block failed");
      toast.success(`Blocked ${name}.`);
      setDialog(null);
      onBlocked?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't block user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More options"
            className={`shrink-0 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity ${className ?? ""}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("report")}>
            <Flag className="w-4 h-4 mr-2" />
            Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("block")} className="text-destructive">
            <Ban className="w-4 h-4 mr-2" />
            Block {name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog === "report"} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this {reportTargetType}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tell us what's wrong (optional). Our team reviews every report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What happened?"
            maxLength={500}
            rows={3}
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={submitReport}>
              Submit report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === "block"} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You won&apos;t see their messages, photos, or connection requests anymore, and they
              won&apos;t be able to connect with you. You can unblock them later from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={submitBlock}>
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
