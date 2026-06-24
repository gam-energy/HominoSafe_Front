"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderIcon } from "@/components/chat/icons";
import { useTranslation } from "react-i18next";

export default function OverviewLayout({
  patient,
  children,
}: {
  patient: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.id) {
      router.replace("/auth/sign-in");
    }
  }, [user, router]);

  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <div className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
          <LoaderIcon size={40} />
        </div>
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-zinc-900 transition-colors duration-300">
      <header className="p-4 md:px-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {t('hi_welcome_back', { name: user.first_name })}
        </h2>
      </header>

      <main className="flex-1 h-full overflow-y-auto">
        {patient}
        {children}
      </main>
    </div>
  );
}
