import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';

export type ThreadComment = {
  id: number;
  userId: number | null;
  authorName: string;
  body: string;
  createdAt: string;
};

const AVATAR_COLORS = ['#105753', '#E07A5F', '#2f9e44', '#f08c00', '#7048e8', '#1098ad'];

function avatarColor(seed: number | string): string {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDateTime(iso: string): string {
  return iso.slice(5, 16).replace('T', ' ').replace('-', '.');
}

function CommentBubble({
  comment,
  isOwn,
  onDelete,
}: {
  comment: ThreadComment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const color = avatarColor(comment.userId ?? comment.authorName);
  return (
    <View className={`flex-row items-end gap-2 ${isOwn ? 'flex-row-reverse self-end' : 'self-start'}`} style={{ maxWidth: '86%' }}>
      <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
        <Text className="text-[11px] font-bold text-white">{comment.authorName.slice(0, 1)}</Text>
      </View>
      <View className="gap-1">
        <View className={`rounded-2xl px-3.5 py-2.5 ${isOwn ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm bg-cream-dark'}`}>
          {isOwn ? null : (
            <Text className="mb-0.5 text-[11px] font-semibold text-primary/70" numberOfLines={1}>
              {comment.authorName}
            </Text>
          )}
          <Text className={`text-sm leading-5 ${isOwn ? 'text-white' : 'text-slate-700'}`}>{comment.body}</Text>
        </View>
        <View className={`flex-row items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <Text className="text-[10px] text-slate-400">{formatDateTime(comment.createdAt)}</Text>
          {isOwn ? (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={11} color="#cbd5e1" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/**
 * 가계부 구성원끼리 특정 대상(거래 내역, 이번 달 등)에 대해 남기는 채팅형 댓글 스레드.
 * TransactionCommentsSection / MonthCommentsSection이 이 위에 데이터 연결만 얹는다.
 */
export function CommentThread({
  title,
  comments,
  placeholder,
  emptyText,
  isAdding,
  onAdd,
  onDelete,
}: {
  title: string;
  comments: ThreadComment[];
  placeholder: string;
  emptyText: string;
  isAdding: boolean;
  onAdd: (body: string) => Promise<unknown>;
  onDelete: (id: number) => void;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [body, setBody] = useState('');
  const canSend = body.trim().length > 0 && !isAdding;

  const handleAdd = async () => {
    const trimmed = body.trim();
    if (!trimmed || isAdding) return;
    try {
      await onAdd(trimmed);
      setBody('');
    } catch {
      // 에러 토스트는 호출부(onAdd)에서 띄운다 — 여기선 재시도할 수 있게 입력값만 유지.
    }
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-1.5">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">💬 {title}</Text>
        {comments.length > 0 ? <Text className="text-xs text-slate-400">{comments.length}</Text> : null}
      </View>

      {comments.length > 0 ? (
        <View className="gap-3">
          {comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              isOwn={comment.userId === currentUserId}
              onDelete={() => onDelete(comment.id)}
            />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-slate-400">{emptyText}</Text>
      )}

      <View className="flex-row items-end gap-2">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          multiline
          className="max-h-24 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <Pressable
          onPress={handleAdd}
          disabled={!canSend}
          className={`h-10 w-10 items-center justify-center rounded-full ${canSend ? 'bg-primary active:bg-primary-dark' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <Ionicons name="arrow-up" size={18} color={canSend ? '#ffffff' : '#94a3b8'} />
        </Pressable>
      </View>
    </View>
  );
}
