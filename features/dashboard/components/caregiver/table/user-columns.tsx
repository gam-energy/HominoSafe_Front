// components/data-table/userColumns.tsx
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/features/dashboard/types/caregiver/user";
import Link from "next/link";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, User2,  } from "lucide-react";

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
    cell: ({ getValue }) => (
      <span className="text-xs max-w-xs truncate block">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "phone_number",
    header: "Phone",
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${
            status === "active"
              ? "bg-green-100 text-green-700"
              : status === "inactive"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/overview/${user.id}`} className="flex items-center gap-2">
                  <User2/> Open Profile
                </Link>
              </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={() => alert(`Edit ${user.username}`)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => alert(`Delete ${user.username}`)} className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
