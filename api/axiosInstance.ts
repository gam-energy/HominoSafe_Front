import axios, {
  AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import Cookies from 'js-cookie';

import { API_BASE_URL } from '@/lib/constants';

// #region agent log
fetch('http://127.0.0.1:7737/ingest/4be4e099-ee11-475d-82b0-2cc77ac7d35a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e45f8c'},body:JSON.stringify({sessionId:'e45f8c',location:'axiosInstance.ts:init',message:'API base URL configured',data:{apiBaseUrl:API_BASE_URL,envUrl:process.env.NEXT_PUBLIC_API_URL??null},timestamp:Date.now(),hypothesisId:'A,C'})}).catch(()=>{});
// #endregion

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: new AxiosHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
});

// گرفتن refreshToken از کوکی
const getRefreshToken = (): string | undefined => Cookies.get('refresh_token');

// ذخیره کردن توکن‌ها در کوکی
const saveTokens = (accessToken: string, refreshToken: string): void => {
  Cookies.set('access_token', accessToken);
  Cookies.set('refresh_token', refreshToken);
};

// Variable to track if refreshing is in progress
let isRefreshing = false;
// Queue to hold requests while refreshing
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // #region agent log
    fetch('http://127.0.0.1:7737/ingest/4be4e099-ee11-475d-82b0-2cc77ac7d35a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e45f8c'},body:JSON.stringify({sessionId:'e45f8c',location:'axiosInstance.ts:request',message:'Outgoing API request',data:{method:config.method,url:config.url,baseURL:config.baseURL,fullUrl:`${config.baseURL??''}${config.url??''}`},timestamp:Date.now(),hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    const token = Cookies.get('access_token');
    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
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
    const originalRequest = error.config as AxiosRequestConfigWithRetry;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set('Authorization', 'Bearer ' + token);
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        window.location.href = '/auth/sign-in';
        return Promise.reject(error);
      }

      return new Promise(function (resolve, reject) {
        axios
          .post(
            `${API_BASE_URL}/refresh-token`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )
          .then(({ data }) => {
            const newAccessToken = data.access;
            const newRefreshToken = data.refresh;
            saveTokens(newAccessToken, newRefreshToken);
            axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
            originalRequest.headers.set('Authorization', 'Bearer ' + newAccessToken);
            processQueue(null, newAccessToken);
            resolve(axiosInstance(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            window.location.href = '/auth/sign-in';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // #region agent log
    fetch('http://127.0.0.1:7737/ingest/4be4e099-ee11-475d-82b0-2cc77ac7d35a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e45f8c'},body:JSON.stringify({sessionId:'e45f8c',location:'axiosInstance.ts:response-error',message:'API response error',data:{code:error.code,message:error.message,status:error.response?.status,url:error.config?.url,baseURL:error.config?.baseURL},timestamp:Date.now(),hypothesisId:'A,B,D'})}).catch(()=>{});
    // #endregion

    return Promise.reject(error);
  }
);

export default axiosInstance;
