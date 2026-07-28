"use client";

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

type OffCampusWarningDialogProps = {
  open: boolean;
  title: string;
  zone: string;
  themeClass: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function OffCampusWarningDialog({
  open,
  title,
  zone,
  themeClass,
  onConfirm,
  onCancel,
}: OffCampusWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className={themeClass} style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
            You&apos;re going out of campus
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: "var(--text-muted)" }}>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {title}
            </span>{" "}
            is at <span className="font-medium">{zone}</span> - outside University of Waterloo.
            You&apos;ll need to travel to get there.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Stay on campus</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
