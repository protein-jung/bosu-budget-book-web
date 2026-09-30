import axios from 'axios';

import { API_BASE_URL } from '@/lib/apiClient';
import { flushClientErrors, reportIfNoResponse } from '@/lib/reportClientError';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export const adminApiClient = axios.create({ baseURL: API_BASE_URL });

adminApiClient.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => {
    flushClientErrors(API_BASE_URL);
    return response;
  },
  (error) => {
    reportIfNoResponse(error, API_BASE_URL);
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
