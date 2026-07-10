"use client";
import React, { useState } from "react";
import { DataTable } from "./table/data-table";
import { userColumns } from "./table/user-columns";
import { useGetAdminUsers } from "@/features/admin/api/use-get-admin-users";
import type { User } from "@/features/dashboard/types/caregiver/user";
import { LoaderIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateUserDialog from "./dialog/CreateUserDialog";

type StatusFilter = "all" | "active" | "inactive";

const AdminDashboard = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users, isLoading, error } = useGetAdminUsers({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-8 h-8 text-blue-500 mb-2 flex items-center justify-center">
            <LoaderIcon size={32} />
          </div>
          <span className="text-muted-foreground">Loading user list...</span>
        </div>
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;

  let filteredData = (users ?? []) as unknown as User[];
  if (roleFilter !== "all") {
    const target = roleFilter.toUpperCase();
    filteredData = filteredData.filter(
      (user) => (user.role ?? "").toUpperCase() === target,
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">User List</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          className="border rounded px-3 py-2"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
          <option value="caregiver">Caregiver</option>
        </select>
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as StatusFilter)
          }
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <CreateUserDialog />
      </div>

      <DataTable columns={userColumns} data={filteredData} />
    </div>
  );
};

export default AdminDashboard;
