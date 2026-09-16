import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useAdminReviews } from '@/features/admin/api';
import type { AdminReview } from '@/lib/types';

function formatDateTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Ionicons key={value} name={value <= rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
      ))}
    </View>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  return (
    <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between gap-2">
        <StarRow rating={review.rating} />
        <Text className="text-xs text-slate-400">{formatDateTime(review.createdAt)}</Text>
      </View>
      <Text className="text-xs text-slate-400">
        {review.authorName}
        {review.authorEmail ? ` (${review.authorEmail})` : ''}
      </Text>
      {review.content ? <Text className="text-sm text-slate-700">{review.content}</Text> : null}
    </View>
  );
}

export default function AdminReviewsScreen() {
  const { data: reviews = [], isLoading } = useAdminReviews();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#082B29" />
      </View>
    );
  }

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[1100px] gap-4 p-6 md:p-8">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-slate-900">리뷰 ({reviews.length}건)</Text>
          <Text className="text-sm text-slate-500">
            {reviews.length > 0 ? `평균 별점 ${average.toFixed(1)}점` : '아직 남겨진 리뷰가 없어요.'}
          </Text>
        </View>
        <View className="gap-2.5">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
