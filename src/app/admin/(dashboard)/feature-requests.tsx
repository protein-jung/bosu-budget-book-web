import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAdminFeatureRequests, useReplyFeatureRequest } from '@/features/admin/api';
import type { AdminFeatureRequest } from '@/lib/types';

function formatDateTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function FeatureRequestRow({ request }: { request: AdminFeatureRequest }) {
  const replyMutation = useReplyFeatureRequest();
  const [draft, setDraft] = useState(request.adminReply ?? '');
  const [editing, setEditing] = useState(false);

  const handleSubmit = () => {
    if (!draft.trim()) return;
    replyMutation.mutate(
      { requestId: request.id, reply: draft.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-semibold text-slate-900">{request.title}</Text>
        <View className={`rounded-full px-2 py-0.5 ${request.adminReply ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <Text className={`text-[11px] font-semibold ${request.adminReply ? 'text-emerald-600' : 'text-amber-600'}`}>
            {request.adminReply ? '답변 완료' : '답변 대기'}
          </Text>
        </View>
      </View>
      <Text className="text-xs text-slate-400">
        {request.authorName}
        {request.authorEmail ? ` (${request.authorEmail})` : ''} · {formatDateTime(request.createdAt)}
      </Text>
      <Text className="text-sm text-slate-700">{request.content}</Text>

      {request.adminReply && !editing ? (
        <View className="gap-2">
          <View className="gap-1 rounded-lg bg-slate-50 p-3">
            <Text className="text-xs font-semibold text-primary">
              답변 {request.repliedAt ? `· ${formatDateTime(request.repliedAt)}` : ''}
            </Text>
            <Text className="text-sm text-slate-700">{request.adminReply}</Text>
          </View>
          <Button title="답변 수정" variant="secondary" onPress={() => setEditing(true)} />
        </View>
      ) : (
        <View className="gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="답변을 입력하세요"
            multiline
            numberOfLines={3}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title="답변 등록" onPress={handleSubmit} loading={replyMutation.isPending} />
            </View>
            {editing ? (
              <View className="flex-1">
                <Button
                  title="취소"
                  variant="secondary"
                  onPress={() => {
                    setDraft(request.adminReply ?? '');
                    setEditing(false);
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

export default function AdminFeatureRequestsScreen() {
  const { data: requests = [], isLoading } = useAdminFeatureRequests();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#01003D" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[1100px] gap-4 p-6 md:p-8">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-slate-900">기능 요청 ({requests.length}건)</Text>
          <Text className="text-sm text-slate-500">
            답변을 등록하면 작성자에게 이메일로 알림이 전송돼요.
          </Text>
        </View>
        <View className="gap-2.5">
          {requests.map((request) => (
            <FeatureRequestRow key={request.id} request={request} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
