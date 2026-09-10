import { View } from 'react-native';

import { CommentThread } from '@/components/CommentThread';
import { useAddTransactionComment, useDeleteTransactionComment, useTransactionComments } from '@/features/transaction/api';
import { getErrorMessage } from '@/lib/apiClient';
import { toast } from '@/store/toastStore';

/** 캘린더 거래 상세(수정) 모달에서, 그 내역에 대해 가계부 구성원끼리 남기는 댓글. */
export function TransactionCommentsSection({ transactionId }: { transactionId: number }) {
  const { data: comments = [] } = useTransactionComments(transactionId);
  const addComment = useAddTransactionComment(transactionId);
  const deleteComment = useDeleteTransactionComment(transactionId);

  return (
    <View className="border-t border-slate-100 pt-4 dark:border-slate-800">
      <CommentThread
        title="댓글"
        comments={comments}
        placeholder="댓글을 남겨보세요"
        emptyText="아직 댓글이 없어요. 첫 댓글을 남겨보세요 🙂"
        isAdding={addComment.isPending}
        onAdd={(body) =>
          addComment.mutateAsync(body).catch((err) => {
            toast.error(getErrorMessage(err, '댓글 저장에 실패했습니다.'));
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
