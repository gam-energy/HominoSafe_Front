"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;

    if (!user?.id) {
      router.replace("/auth/sign-in");
      return;
    }

    switch (user.role) {
      case "admin":
        router.replace("/dashboard/users");
        break;
      case "patient":
        router.replace("/dashboard/overview");
        break;
      case "doctor":
        router.replace("/dashboard/doctor-overview");
        break;
      case "caregiver":
        router.replace("/dashboard/caregiver-overview");
        break;
      case "clinic_admin":
        router.replace("/dashboard/clinics");
        break;
      default:
        router.replace("/dashboard/overview");
        break;
    }
  }, [user, router]);

  return null;
}
