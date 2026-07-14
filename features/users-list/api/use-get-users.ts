import axiosInstance from "@/api/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchAdminUsers = async () => {
  const { data } = await axiosInstance.get("/admin/users");
  return data;
};

export function useGetAdminUsers(enabled = true) {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    enabled,
  });
}
