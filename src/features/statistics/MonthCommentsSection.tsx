import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAddMonthComment, useDeleteMonthComment, useMonthComments } from '@/features/statistics/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

function formatDateTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

/** 통계(월별 요약) 화면 맨 위에서, 그 달에 대해 가계부 구성원끼리 남기는 코멘트. */
export function MonthCommentsSection({ year, month }: { year: number; month: number }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { data: comments = [] } = useMonthComments(year, month);
  const addComment = useAddMonthComment(year, month);
  const deleteComment = useDeleteMonthComment(year, month);
  const [body, setBody] = useState('');

  const handleAdd = () => {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error('코멘트를 입력해주세요.');
      return;
    }
    addComment.mutate(trimmed, {
      onSuccess: () => setBody(''),
      onError: (err) => toast.error(getErrorMessage(err, '코멘트 저장에 실패했습니다.')),
    });
  };

  const handleDelete = (id: number) => {
    deleteComment.mutate(id, {
      onError: (err) => toast.error(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
      <Text className="text-base font-semibold text-slate-900 dark:text-white">이번 달 코멘트</Text>

      {comments.length > 0 ? (
        <View className="gap-3">
          {comments.map((comment) => (
            <View key={comment.id} className="gap-0.5">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-sm font-medium text-slate-900 dark:text-white" numberOfLines={1}>
                  {comment.authorName}
                </Text>
                <Text className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</Text>
                {comment.userId === currentUserId ? (
                  <Pressable onPress={() => handleDelete(comment.id)} hitSlop={8}>
                    <Text className="text-xs font-medium text-red-500">삭제</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text className="text-sm text-slate-700 dark:text-slate-200">{comment.body}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-slate-400">아직 남긴 코멘트가 없어요.</Text>
      )}

      <View className="gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <TextField
          label="코멘트 남기기"
          value={body}
          onChangeText={setBody}
          placeholder="이번 달에 대한 코멘트를 남겨보세요"
          multiline
          numberOfLines={2}
        />
        <Button title="남기기" onPress={handleAdd} loading={addComment.isPending} />
      </View>
    </View>
  );
}
