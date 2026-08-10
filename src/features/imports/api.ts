import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Platform } from 'react-native';

import { CARD_QUERY_KEY } from '@/features/card/api';
import { CATEGORY_QUERY_KEY } from '@/features/category/api';
import { apiClient } from '@/lib/apiClient';
import type { ImportProvider, ImportResult } from '@/lib/types';

type ImportStatementParams = {
  provider: ImportProvider;
  file: DocumentPickerAsset;
  cardId?: number | null;
  cardName?: string | null;
};

function buildFormData(file: DocumentPickerAsset): FormData {
  const formData = new FormData();
  if (Platform.OS === 'web' && file.file) {
    formData.append('file', file.file, file.name);
  } else {
    formData.append(
      'file',
      { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' } as unknown as Blob,
    );
  }
  return formData;
}

const importApi = {
  importStatement: ({ provider, file, cardId, cardName }: ImportStatementParams) =>
    apiClient
      .post<ImportResult>('/api/imports', buildFormData(file), {
        params: { provider, cardId: cardId ?? undefined, cardName: cardName ?? undefined },
      })
      .then((res) => res.data),
};

export function useImportStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importApi.importStatement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CARD_QUERY_KEY });
    },
  });
}
