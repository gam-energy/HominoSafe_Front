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
    let cancelled = false;

    const fetchUser = async () => {
      const accessToken = Cookies.get("access_token");
      const refreshToken = Cookies.get("refresh_token");

      // refresh may be HttpOnly (not visible to js-cookie); access_token is enough
      if (!accessToken) {
        return;
      }

      try {
        const response = await axiosInstance.get("/user/");
        if (!cancelled) setUser(response.data);
      } catch (err) {
        const error = err as AxiosError;
        console.error("❌ خطا در دریافت اطلاعات کاربر:", error.message);
        if (!cancelled) setUser(null);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
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
