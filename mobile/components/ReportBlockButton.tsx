import { Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { reportContent, blockUser } from "@/api/moderation";
import { colors } from "@/lib/theme";

/**
 * Report/Block affordance for content posted by another user - mirrors the
 * web app's <ReportBlockMenu> (src/components/ui/ReportBlockMenu.tsx) but
 * built on RN's native Alert instead of a dropdown/dialog, since that's
 * already the app's convention for confirmations (see chat/[id].tsx).
 */
type Props = {
  targetUserId: string;
  targetUserName?: string;
  reportTargetType: "message" | "photo" | "user";
  reportTargetId: string;
  onBlocked?: () => void;
};

export function ReportBlockButton({
  targetUserId,
  targetUserName,
  reportTargetType,
  reportTargetId,
  onBlocked,
}: Props) {
  const name = targetUserName?.trim() || "this user";

  const doReport = async () => {
    try {
      const res = await reportContent(reportTargetType, reportTargetId);
      if (!res.success) throw new Error(res.error);
      Alert.alert("Thanks", "We'll take a look.");
    } catch (e) {
      Alert.alert("Couldn't submit report", e instanceof Error ? e.message : "Try again.");
    }
  };

  const confirmBlock = () => {
    Alert.alert(
      `Block ${name}?`,
      "You won't see their messages, photos, or connection requests anymore.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await blockUser(targetUserId);
              if (!res.success) throw new Error(res.error);
              onBlocked?.();
            } catch (e) {
              Alert.alert("Couldn't block user", e instanceof Error ? e.message : "Try again.");
            }
          },
        },
      ]
    );
  };

  const openMenu = () => {
    Alert.alert(name, undefined, [
      { text: "Report", onPress: doReport },
      { text: `Block ${name}`, style: "destructive", onPress: confirmBlock },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <Pressable onPress={openMenu} hitSlop={8} accessibilityLabel="More options">
      <Ionicons name="ellipsis-vertical" size={14} color={colors.textMuted} />
    </Pressable>
  );
}
