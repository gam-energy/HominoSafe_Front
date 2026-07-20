// components/data-table/userColumns.tsx
"use client";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/features/dashboard/types/caregiver/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  MoreHorizontal,
  User2,
  MessageCircle,
  Loader2,
  FileHeart,
  Gauge,
  Brain,
  FileUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateRoom } from "@/features/chat/api/use-craete-room";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import { staffPatientRoutes, patientPublicRef } from "@/features/patient-knowledge/utils/staffRoutes";

function PatientRowActions({ user }: { user: User }) {
  const { user: currentUser } = useUser();
  const routes = staffPatientRoutes(
    currentUser?.role,
    patientPublicRef(user),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={routes.detailRoute} className="flex items-center gap-2">
            <User2 className="h-4 w-4" /> Open Overview
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.medicalProfileRoute} className="flex items-center gap-2">
            <FileHeart className="h-4 w-4" /> Medical Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.healthKpisRoute} className="flex items-center gap-2">
            <Gauge className="h-4 w-4" /> Health KPIs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.clinicalAgentRoute} className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> Clinical Agent
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.importRoute} className="flex items-center gap-2">
            <FileUp className="h-4 w-4" /> Import Records
          </Link>
        </DropdownMenuItem>
        <MessagePatientMenuItem user={user} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessagePatientMenuItem({ user }: { user: User }) {
  const router = useRouter();
  const { t } = useTranslation();
  const createRoomMutation = useCreateRoom();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await createRoomMutation.mutateAsync({
        target_username: user.username,
        room_name: user.username,
        topic: "General_discussion",
      });
      if (response?.room_id) {
        router.push(`/dashboard/chat/${response.room_id}`);
      }
    } catch (error) {
      console.error("Failed to start chat with patient:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 cursor-pointer"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {t("message_patient", "Message Patient")}
    </DropdownMenuItem>
  );
}

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
    cell: ({ row }) => <PatientRowActions user={row.original} />,
  },
];
