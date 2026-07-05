import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import axios from 'axios';
import { LoginFormValues, LoginResponse } from '../types/auth';
import {useRouter} from "next/navigation"

const MATRIX_HOMESERVER_URL = 'http://localhost:8008'; // URL و پورت Synapse

// 1️⃣ ورود به اپلیکیشن خودت
const loginUser = async (credentials: LoginFormValues): Promise<LoginResponse> => {
  const formData = new URLSearchParams();
  formData.append('login_type', 'user');
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await axiosInstance.post<LoginResponse>('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.status !== 200) throw new Error('Login failed');
  return response.data;
};

// 2️⃣ ورود به Synapse
const loginToMatrix = async (username: string, password: string) => {
  const response = await axios.post(`${MATRIX_HOMESERVER_URL}/_matrix/client/r0/login`, {
    type: 'm.login.password',
    user: "admin",
    password: "adminpass",
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status !== 200) throw new Error('Matrix login failed');
  return response.data; // شامل access_token و user_id
};

// 3️⃣ هوک سفارشی لاگین
export const useLogin = () => {
    const router = useRouter()
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginFormValues>({
    mutationFn: loginUser,
    onSuccess: async (data, variables) => {
      // 🌟 ورود به اپلیکیشن خودت
      Cookies.set('access_token', data.access_token, { expires: 1, secure: false, sameSite: 'Lax' });
      Cookies.set('refresh_token', data.refresh_token, { expires: 7, secure: false, sameSite: 'Lax' });
      Cookies.set('synapse_access_token', data.synapse_access_token, { expires: 7, secure: false, sameSite: 'Lax' });
      toast.success('Logged in successfully');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      // 🌟 ورود همزمان به Synapse
      // try {
      //   const matrixData = await loginToMatrix(variables.username, variables.password);
      //   Cookies.set('matrix_access_token', matrixData.access_token, { expires: 1, secure: false, sameSite: 'Lax' });
      //   console.log('Matrix login successful:', matrixData.user_id);
      // } catch (err) {
      //   console.error('Matrix login error:', err);
      //   toast.error('Matrix login to Synapse failed!');
      // }

      // 🔹 در صورت نیاز می‌توانید این خط را فعال کنید
      // router.push("/")
      window.location.href = "/"
    },
    onError: (error) => {
      toast.error(error.message || 'خطا در ورود!');
      console.error('Login error:', error);
    },
  });
};
