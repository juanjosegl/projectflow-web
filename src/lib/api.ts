import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { accessToken, useAuthStore } from '@/store/auth.store';
import { ApiResponse } from '@/types';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = accessToken.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One refresh at a time: the refresh token rotates on every use, so parallel 401s must
// share a single request instead of racing (the losers would present a revoked token).
let pendingRefresh: Promise<string> | null = null;

function refreshAccessToken() {
  pendingRefresh ??= axios
    .post<ApiResponse<{ accessToken: string }>>(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => {
      accessToken.set(data.data.accessToken);
      return data.data.accessToken;
    })
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}

// A 401 from these means bad credentials, not an expired session.
const CREDENTIAL_ROUTES = ['/auth/login', '/auth/register'];

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    const expired =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !CREDENTIAL_ROUTES.some((route) => original.url?.endsWith(route));
    if (!expired) return Promise.reject(error);

    original._retry = true;
    try {
      original.headers.Authorization = `Bearer ${await refreshAccessToken()}`;
      return api(original);
    } catch {
      useAuthStore.getState().signOut();
      // A full reload on purpose: it drops every cached query of the expired session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);

export default api;
