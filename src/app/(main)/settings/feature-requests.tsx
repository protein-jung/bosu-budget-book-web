import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useCreateFeatureRequest, useFeatureRequests } from '@/features/featureRequest/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import { toast } from '@/store/toastStore';

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export default function FeatureRequestsScreen() {
  const { data: requests = [], isLoading } = useFeatureRequests();
  const createRequest = useCreateFeatureRequest();
  const isDesktop = useIsDesktop();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    createRequest.mutate(
      { title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          toast.success('요청을 남겼어요. 답변이 달리면 이메일로 알려드릴게요.');
          setTitle('');
          setContent('');
          setFormOpen(false);
        },
        onError: (err) => toast.error(getErrorMessage(err, '등록에 실패했습니다.')),
      },
    );
  };

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">기능 요청</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          있었으면 하는 기능이나 불편한 점을 자유롭게 남겨주세요. 개발자가 확인하고 답변을 남기면
          이메일로 알려드려요.
        </Text>
      </View>

      {formOpen ? (
        <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
          <TextField label="제목" value={title} onChangeText={setTitle} placeholder="예) 다크모드 지원해주세요" />
          <TextField
            label="내용"
            value={content}
            onChangeText={setContent}
            placeholder="어떤 점이 불편했는지, 어떤 기능이 있으면 좋을지 자유롭게 적어주세요"
            multiline
            numberOfLines={5}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title="등록하기" onPress={handleSubmit} loading={createRequest.isPending} />
            </View>
            <View className="flex-1">
              <Button title="취소" variant="secondary" onPress={() => setFormOpen(false)} />
            </View>
          </View>
        </View>
      ) : (
        <Button title="+ 새 요청 남기기" onPress={() => setFormOpen(true)} />
      )}

      {isLoading ? (
        <Text className="text-sm text-slate-400">불러오는 중...</Text>
      ) : requests.length === 0 ? (
        <Text className="text-sm text-slate-400">아직 남겨진 요청이 없어요. 첫 요청을 남겨보세요.</Text>
      ) : (
        <View className="gap-3">
          {requests.map((request) => (
            <View key={request.id} className="gap-2 rounded-xl bg-white p-4 dark:bg-slate-900">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
                  {request.title}
                </Text>
                <Text
                  className={`text-xs font-medium ${
                    request.adminReply ? 'text-income' : 'text-slate-400'
                  }`}>
                  {request.adminReply ? '답변 완료' : '답변 대기중'}
                </Text>
              </View>
              <Text className="text-xs text-slate-400">
                {request.authorName} · {formatDate(request.createdAt)}
              </Text>
              <Text className="text-sm text-slate-700 dark:text-slate-200">{request.content}</Text>

              {request.adminReply ? (
                <View className="gap-1 rounded-lg bg-primary-light p-3 dark:bg-primary-dark/30">
                  <Text className="text-xs font-semibold text-primary dark:text-secondary">
                    개발자 답변 {request.repliedAt ? `· ${formatDate(request.repliedAt)}` : ''}
                  </Text>
                  <Text className="text-sm text-slate-700 dark:text-slate-200">{request.adminReply}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
