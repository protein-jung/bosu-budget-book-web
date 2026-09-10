import { View } from 'react-native';

import { CommentThread } from '@/components/CommentThread';
import { useAddMonthComment, useDeleteMonthComment, useMonthComments } from '@/features/statistics/api';
import { getErrorMessage } from '@/lib/apiClient';
import { toast } from '@/store/toastStore';

/** 통계(월별 요약) 화면 맨 위에서, 그 달에 대해 가계부 구성원끼리 남기는 코멘트. */
export function MonthCommentsSection({ year, month }: { year: number; month: number }) {
  const { data: comments = [] } = useMonthComments(year, month);
  const addComment = useAddMonthComment(year, month);
  const deleteComment = useDeleteMonthComment(year, month);

  return (
    <View className="rounded-xl bg-white p-4 dark:bg-slate-900">
      <CommentThread
        title="이번 달 코멘트"
        comments={comments}
        placeholder="이번 달에 대한 코멘트를 남겨보세요"
        emptyText="아직 남긴 코멘트가 없어요. 첫 코멘트를 남겨보세요 🙂"
        isAdding={addComment.isPending}
        onAdd={(body) =>
          addComment.mutateAsync(body).catch((err) => {
            toast.error(getErrorMessage(err, '코멘트 저장에 실패했습니다.'));
            throw err;
          })
        }
        onDelete={(id) =>
          deleteComment.mutate(id, {
            onError: (err) => toast.error(getErrorMessage(err, '삭제에 실패했습니다.')),
          })
        }
      />
    </View>
  );
}
