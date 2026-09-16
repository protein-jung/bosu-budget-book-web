import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useCreateReview, useMyReviews } from '@/features/review/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import { toast } from '@/store/toastStore';

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function StarRow({
  rating,
  onChange,
  size = 32,
}: {
  rating: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable key={value} onPress={onChange ? () => onChange(value) : undefined} hitSlop={4}>
          <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={size} color="#f59e0b" />
        </Pressable>
      ))}
    </View>
  );
}

export default function ReviewScreen() {
  const { data: reviews = [], isLoading } = useMyReviews();
  const createReview = useCreateReview();
  const isDesktop = useIsDesktop();

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('별점을 선택해주세요.');
      return;
    }
    createReview.mutate(
      { rating, content: content.trim() || null },
      {
        onSuccess: () => {
          toast.success('리뷰를 남겨주셔서 감사해요!');
          setRating(0);
          setContent('');
        },
        onError: (err) => toast.error(getErrorMessage(err, '등록에 실패했습니다.')),
      },
    );
  };

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">리뷰 남기기</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          보수가계부를 사용하시면서 느낀 점을 자유롭게 남겨주세요. 횟수 제한 없이 언제든 다시 남길 수
          있어요.
        </Text>
      </View>

      <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
        <StarRow rating={rating} onChange={setRating} />
        <TextField
          label="한줄평 (선택)"
          value={content}
          onChangeText={setContent}
          placeholder="좋았던 점이나 아쉬운 점을 자유롭게 적어주세요"
          multiline
          numberOfLines={4}
          style={{ minHeight: 96, textAlignVertical: 'top' }}
        />
        <Button title="리뷰 남기기" onPress={handleSubmit} loading={createReview.isPending} />
      </View>

      {isLoading ? (
        <Text className="text-sm text-slate-400">불러오는 중...</Text>
      ) : reviews.length === 0 ? (
        <Text className="text-sm text-slate-400">아직 남긴 리뷰가 없어요.</Text>
      ) : (
        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            내가 남긴 리뷰 ({reviews.length})
          </Text>
          {reviews.map((review) => (
            <View key={review.id} className="gap-2 rounded-xl bg-white p-4 dark:bg-slate-900">
              <View className="flex-row items-center justify-between">
                <StarRow rating={review.rating} size={16} />
                <Text className="text-xs text-slate-400">{formatDate(review.createdAt)}</Text>
              </View>
              {review.content ? (
                <Text className="text-sm text-slate-700 dark:text-slate-200">{review.content}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
