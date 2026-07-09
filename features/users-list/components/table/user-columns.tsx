// components/data-table/userColumns.tsx
import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/features/dashboard/types/caregiver/user";
import Link from "next/link";
import {
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  User2,
  Eye,
} from "lucide-react";
import {
  roleBadgeClass,
  roleLabel,
  statusBadgeClass,
  statusLabel,
} from "@/features/admin/utils/normalizeEnum";

import {
  Button,
} from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UpdatePatientForm from "../form/UpdatePatientForm";
import AssignUserForm from "../form/AssignUserForm";
import UpdateCaregiverForm from "../form/UpdateCaregiverForm";
import UpdateDoctorForm from "../form/UpdateDoctorForm";
import { useDeleteUser } from "../../api/use-delete-user";
// import UpdateDoctorForm, UpdateCaregiverForm if you have them...

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-xs flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Username <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase text-foreground">
            {user.first_name?.[0] ?? user.username?.[0]}
          </div>
          <span>{user.username}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email,
  },
  {
    accessorKey: "first_name",
    header: "First Name",
    cell: ({ row }) => row.original.first_name,
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
    cell: ({ row }) => row.original.last_name,
  },
  {
    accessorKey: "phone_number",
    header: "Phone Number",
    cell: ({ row }) => row.original.phone_number,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${statusBadgeClass(
            status,
          )}`}
        >
          {statusLabel(status)}
        </span>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => {
      const role = getValue<string>();
      return (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${roleBadgeClass(
            role,
          )}`}
        >
          {roleLabel(role)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const deleteUser = useDeleteUser();


      // Modal state
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [open, setOpen] = useState(false);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [IsAssignFormOpen, setIsAssignFormOpen] = useState(false);



      const renderUpdateForm = (user: User , setOpen : ( isOpen : boolean)=> void) => {
        switch (user.role) {
          case "patient":
            return (
              <UpdatePatientForm
                id={user.id} OpenModal={setOpen}/>
            );
          case "doctor":
            return (
              <UpdateDoctorForm
                id={user.id} OpenModal={setOpen}/>
            );
          case "caregiver":
            return (
              <UpdateCaregiverForm
                id={user.id} OpenModal={setOpen}/>
            );
        }
      };

      const handleAssign = () => setIsAssignFormOpen(true);
      // const handleCloseAssign = () => setIsAssignFormOpen(false);

      const handleEdit = () => setOpen(true);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-white">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" /> View detail
                </Link>
              </DropdownMenuItem>
              {user.role === "patient" &&
              <DropdownMenuItem onClick={handleAssign}
                className="flex items-center gap-2 text-destructive">
                  <User2/> Assign To
              </DropdownMenuItem>
              }
              <DropdownMenuItem
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={()=> deleteUser.mutate(user.id)}
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {IsAssignFormOpen && user.role === "patient" && (
            <AssignUserForm
              userId={user.id}
              setIsAssignFormOpen={setIsAssignFormOpen}
            />
          )}
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded shadow-lg p-6 min-w-[320px] relative">
                <button
                  className="absolute top-2 right-2 text-gray-400"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
                <h2 className="text-lg font-semibold mb-4">Update {user.role}</h2>
                {renderUpdateForm(user,setOpen)}
              </div>
            </div>
          )}
        </>
      );
    },
  },
];
