"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axiosInstance, { refreshAccessToken } from "@/api/axiosInstance";
import { AxiosError } from "axios";
import Cookies from "js-cookie";
import { clearAuthRedirectGuard, isJwtExpired } from "@/lib/auth-session";

type CareTeamMember = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialization?: string | null;
  relationship_to_patient?: string | null;
};

type ClinicInfo = {
  id: number;
  name: string;
  code?: string | null;
};

type User = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  id: number;
  uuid?: string;
  role: "admin" | "clinic_admin" | "patient" | "caregiver" | "doctor";
  status: "active" | "inactive";
  doctor_id?: number | null;
  caregiver_id?: number | null;
  clinic_id?: number | null;
  doctor?: CareTeamMember | null;
  caregiver?: CareTeamMember | null;
  clinic?: ClinicInfo | null;
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
      if (!accessToken) {
        return;
      }

      clearAuthRedirectGuard();

      try {
        if (isJwtExpired(accessToken) && Cookies.get("refresh_token")) {
          try {
            await refreshAccessToken();
          } catch {
            // refresh failure is handled by axios interceptor / caller
          }
        }

        const response = await axiosInstance.get("/user/");
        if (!cancelled) setUser(response.data);
      } catch (err) {
        const error = err as AxiosError;
        console.error("Failed to load user profile:", error.message);
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
