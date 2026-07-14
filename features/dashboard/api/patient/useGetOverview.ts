// hooks/useDashboardOverviewWithInterval.ts
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { DashboardData } from "@/features/dashboard/types/patient/overview";
import { AxiosError } from "axios";

// تابع fetch داده‌ها
const fetchDashboardOverview = async (
  userId: number
): Promise<DashboardData> => {
  const response = await axiosInstance.get<DashboardData>(
    "/api/dashboard/overview",
    {
      params: { user_id: userId },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.data;
};

// Hook با interval
export const useGetOVerview = (userId: number) => {
  return useQuery<DashboardData, AxiosError>({
    queryKey: ["dashboard-overview", userId], // invalidated after CDS analyze
    queryFn: () => fetchDashboardOverview(userId),
    enabled: !!userId, // فقط وقتی userId موجوده اجرا بشه
    staleTime: 1000 * 60 * 1, // داده‌ها تا 1 دقیقه کش بشن
    refetchInterval: 1000 * 60 * 1, // هر 1 دقیقه داده‌ها رفرش بشن
    refetchIntervalInBackground: true, // حتی وقتی تب غیرفعال است رفرش کنه
  });
};
