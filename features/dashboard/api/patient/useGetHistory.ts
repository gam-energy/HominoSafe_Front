// hooks/useHistory.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { HistoryData } from "@/features/dashboard/types/patient/history";
import { AxiosError } from "axios";

/* ================= TYPE ================= */
export type TimePeriod = "day" | "week" | "month";

/* تبدیل TimePeriod به تعداد روز برای API */
const TIME_PERIOD_TO_DAYS: Record<TimePeriod, number> = {
  day: 1,
  week: 7,
  month: 30,
};

/* پارامترهای قابل ارسال به API */
interface HistoryParams {
  userId: number;
  metrics: string[];
  days: number;
}

/* ================= FETCH FUNCTION ================= */
const fetchHistory = async ({
  userId,
  metrics,
  days,
}: HistoryParams): Promise<HistoryData> => {
  // FastAPI expects repeated query keys: metrics=heart_rate&metrics=spo2
  // (not a single comma-joined value).
  const response = await axiosInstance.get<HistoryData>(
    "/api/dashboard/history",
    {
      params: {
        user_id: userId,
        metrics,
        ...(days != null ? { days } : {}),
      },
      paramsSerializer: {
        // axios → metrics=a&metrics=b (FastAPI List[str])
        indexes: null,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to fetch history data");
  }

  return response.data;
};

/* ================= HOOK ================= */
export type UseHistoryResult = UseQueryResult<HistoryData, AxiosError>;

export const useHistory = (
  userId: number,
  metrics: string[],
  period?: TimePeriod
): UseHistoryResult => {
  const days = period ? TIME_PERIOD_TO_DAYS[period] : 7;

  return useQuery<HistoryData, AxiosError>({
    queryKey: ["history", userId, metrics, days],
    queryFn: () =>
      fetchHistory({
        userId,
        metrics,
        days,
      }),
    enabled: !!userId && metrics.length > 0,
    staleTime: 1000 * 60 * 5, // ۵ دقیقه کش
  });
};
