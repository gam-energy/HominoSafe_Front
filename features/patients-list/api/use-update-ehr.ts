import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { toast } from 'sonner';


export function useUpdateEhr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => {
      return axiosInstance.put(
        `/medical/logs`,
        data,
        { headers: { "Content-Type": "application/json" } }
      );
    },
    onSuccess: (_data, variables: { user_id?: number }) => {
      toast.success("User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-users", "user-profiles"] });
      if (variables?.user_id) {
        queryClient.invalidateQueries({
          queryKey: ["patient-ehr-profiles", variables.user_id],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["patient-ehr-profiles"] });
      }
      queryClient.invalidateQueries({ queryKey: ["medical-profile"] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      let message = "Error updating User";
      if (Array.isArray(detail)) {
        message = detail.map((d: any) => d.msg).join(" | ");
      } else if (typeof detail === "string") {
        message = detail;
      }
      toast.error(message);
    },
  });
}
