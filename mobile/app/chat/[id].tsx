import { useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { bubbleMessages, sendBubbleMessage, type BubbleMessage } from "@/api/bubbles";
import { useGuest } from "@/contexts/GuestContext";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { ReportBlockButton } from "@/components/ReportBlockButton";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isGuest } = useGuest();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<BubbleMessage>>(null);

  const query = useQuery({
    queryKey: ["bubble-messages", id],
    queryFn: () => bubbleMessages(id),
    enabled: !isGuest && !!id,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendBubbleMessage(id, content),
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["bubble-messages", id] });
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Couldn't send that message. Try again.";
      Alert.alert("Message not sent", message);
    },
  });

  const messages = query.data?.data ?? [];
  const canSend = text.trim().length > 0 && !sendMutation.isPending;

  const onSend = () => {
    const content = text.trim();
    if (!content) return;
    sendMutation.mutate(content);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <AuroraBackground dimmed />
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{ paddingTop: insets.top + 12, borderColor: colors.cardBorder }}
        className="flex-row items-center border-b px-4 pb-3"
      >
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold" style={{ color: colors.textPrimary }}>
          Chat
        </Text>
        {!isGuest && (
          <Pressable onPress={() => router.push(`/end-event/${id}`)}>
            <Text className="text-xs font-semibold" style={{ color: colors.accentMid }}>
              End Event
            </Text>
          </Pressable>
        )}
      </View>

      {isGuest ? (
        <EmptyState emoji="💬" title="Sign in to chat" subtitle="Guests can browse but not join conversations." />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <EmptyState
          emoji="⚠️"
          title="Couldn't load messages"
          subtitle={query.error instanceof Error ? query.error.message : "Check your connection and try again."}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="px-4 py-3"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<EmptyState emoji="👋" title="No messages yet" subtitle="Be the first to say hi." />}
          renderItem={({ item }) => (
            <View className="mb-3">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {item.sender_name}
                </Text>
                {item.user_id !== user?.id && (
                  <ReportBlockButton
                    targetUserId={item.user_id}
                    targetUserName={item.sender_name}
                    reportTargetType="message"
                    reportTargetId={item.id}
                    onBlocked={() => queryClient.invalidateQueries({ queryKey: ["bubble-messages", id] })}
                  />
                )}
              </View>
              <Text className="mt-0.5 text-base" style={{ color: colors.textPrimary }}>
                {item.content}
              </Text>
            </View>
          )}
        />
      )}

      {!isGuest ? (
        <View
          style={{ paddingBottom: insets.bottom + 12, borderColor: colors.cardBorder }}
          className="flex-row items-center gap-2 border-t px-4 pt-3"
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            maxLength={500}
            multiline
            editable={!sendMutation.isPending}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm"
            style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.textPrimary, maxHeight: 100 }}
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: canSend ? colors.accentMid : colors.cardGlassBg }}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Ionicons name="send" size={16} color={canSend ? "#FFFFFF" : colors.textSecondary} />
            )}
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
