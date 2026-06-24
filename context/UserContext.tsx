"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axiosInstance from "@/api/axiosInstance"; 
import { AxiosError } from "axios";
import Cookies from "js-cookie";

type User = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  id: number;
  role: "admin" | "patient" | "caregiver" | "doctor";
  status: "active" | "inactive";
} | null;

interface UserContextType {
  role: string;
  user: User;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = Cookies.get("access_token");
      const refreshToken = Cookies.get("refresh_token");

      if (!accessToken || !refreshToken) {
        console.warn("⏳ توکن‌ها هنوز ست نشده‌اند، درخواست به /user ارسال نمی‌شود");
        return;
      }

      try {
        const response = await axiosInstance.get("/user/");
        setUser(response.data);
      } catch (err) {
        const error = err as AxiosError;
        console.error("❌ خطا در دریافت اطلاعات کاربر:", error.message);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, role: user?.role || "" }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser باید داخل UserProvider استفاده شود");
  return context;
};
