import axios, {
  AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import Cookies from 'js-cookie';
import { getApiBaseUrl } from '@/lib/api-utils';
import {
  AUTH_COOKIE_OPTS,
  clearAuthCookies,
  redirectToSignIn,
} from '@/lib/auth-session';

/** Prefer calling getApiBaseUrl() — host-aware in the browser. */
export const API_BASE_URL = getApiBaseUrl();

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: new AxiosHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
  timeout: 30_000,
  withCredentials: true,
});

const getRefreshToken = (): string | undefined => Cookies.get('refresh_token');

const saveTokens = (accessToken: string, refreshToken: string): void => {
  Cookies.set('access_token', accessToken, { ...AUTH_COOKIE_OPTS, expires: 1 });
  Cookies.set('refresh_token', refreshToken, { ...AUTH_COOKIE_OPTS, expires: 7 });
};

export interface RefreshTokenResponse {
  access_token?: string;
  refresh_token?: string;
  access?: string;
  refresh?: string;
  synapse_access_token?: string;
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return /\/(refresh-token|token|logout)(\?|$)/.test(url);
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const base = getApiBaseUrl();
  const prevAccess = Cookies.get('access_token');

  const { data } = await axios.post<RefreshTokenResponse>(
    `${base}/refresh-token`,
    { refresh_token: refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(prevAccess ? { Authorization: `Bearer ${prevAccess}` } : {}),
      },
      withCredentials: true,
      timeout: 12_000,
    }
  );

  const newAccessToken = data.access_token ?? data.access;
  const newRefreshToken = data.refresh_token ?? data.refresh;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error('Invalid refresh response');
  }

  saveTokens(newAccessToken, newRefreshToken);
  if (data.synapse_access_token) {
    Cookies.set('synapse_access_token', data.synapse_access_token, {
      ...AUTH_COOKIE_OPTS,
      expires: 7,
    });
  }
  return newAccessToken;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    } else {
      prom.reject(new Error('Token refresh queue drained without token or error'));
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    }
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface AxiosRequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (!originalRequest.headers) {
              originalRequest.headers = new AxiosHeaders();
            }
            originalRequest.headers.set('Authorization', 'Bearer ' + token);
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        clearAuthCookies();
        redirectToSignIn();
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshAccessToken();
        axiosInstance.defaults.headers.common['Authorization'] =
          'Bearer ' + newAccessToken;
        if (!originalRequest.headers) {
          originalRequest.headers = new AxiosHeaders();
        }
        originalRequest.headers.set('Authorization', 'Bearer ' + newAccessToken);
        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearAuthCookies();
        redirectToSignIn();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
