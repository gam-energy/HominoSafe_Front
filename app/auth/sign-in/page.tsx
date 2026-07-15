"use client";

import { useEffect } from "react";
import { useLogin } from "@/features/auth/api/use-sign-in";
import { LoginForm } from "@/features/auth/components/LoginForm";
import Image from "next/image";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ModeToggle } from "@/components/layout/ThemeToggle/theme-toggle";
import { useTranslation } from "react-i18next";
import { clearAuthRedirectGuard } from "@/lib/auth-session";

const Page = () => {
  const { t } = useTranslation();
  const loginMutation = useLogin();

  useEffect(() => {
    clearAuthRedirectGuard();
  }, []);

  const handleSubmit = (values: { username: string; password: string }) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        console.log("✅ Success", data);
      },
      onError: (error: any) => {
        console.error("❌ Error", error);
      },
    });
  };

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-70" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-70" />

      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
        <div className="hidden lg:flex flex-col gap-6 w-1/2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
              <Image src="/assets/images/logo.png" alt="Logo" width={40} height={40} className="brightness-0 invert" />
            </div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
              SenioSentry
            </h1>
          </div>
          <h2 className="text-5xl font-bold text-zinc-900 dark:text-white leading-[1.1]">
            {t("empowering_smart_care")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("hero_description")}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
              <p className="text-blue-600 font-bold">{t("real_time")}</p>
              <p className="text-sm text-muted-foreground">{t("vitals_monitoring")}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
              <p className="text-blue-600 font-bold">{t("ai_driven")}</p>
              <p className="text-sm text-muted-foreground">{t("predictive_analysis")}</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 max-w-md relative">
          <div className="absolute top-0 right-0 p-4 flex items-center gap-2">
            <ModeToggle />
            <LanguageToggle />
          </div>
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Image src="/assets/images/logo.png" alt="Logo" width={32} height={32} />
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              SenioSentry
            </h1>
          </div>
          <LoginForm onSubmit={handleSubmit} />
        </div>
      </div>
    </section>
  );
};

export default Page;
