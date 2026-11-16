import api from '../api';
import { User, ApiResponse } from '@/types';

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/register', data);
    return res.data.data;
  },
  async login(data: { email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data);
    return res.data.data;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  /** Full-page redirect: the OAuth flow runs on the API and comes back to /auth/callback. */
  signInWithGoogle() {
    // The destination is the API's origin, not a Next.js page, so the router can't handle it.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`);
  },
  async me() {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
