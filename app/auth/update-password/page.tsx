"use client";

import UpdatePasswordForm from "@/features/auth/components/UpdatePasswordForm";
import { AuthBrand } from "@/features/auth/components/AuthBrand";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ModeToggle } from "@/components/layout/ThemeToggle/theme-toggle";

const Page = () => {
  return (
    <section
      style={{ paddingTop: "calc(1rem + var(--app-sat, 0px))" }}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 dark:bg-zinc-950"
    >
      <div
        className="pointer-events-none absolute top-[-12%] start-[-8%] h-[42%] w-[42%] rounded-full bg-blue-100/80 blur-3xl dark:bg-blue-900/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-12%] end-[-8%] h-[42%] w-[42%] rounded-full bg-sky-100/70 blur-3xl dark:bg-sky-900/15"
        aria-hidden
      />

      <div
        style={{ top: "calc(1rem + var(--app-sat, 0px))" }}
        className="absolute end-4 z-20 flex items-center gap-2"
      >
        <ModeToggle />
        <LanguageToggle />
      </div>

      <AuthBrand className="relative z-10 mb-6" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 sm:p-8">
        <UpdatePasswordForm />
      </div>
    </section>
  );
};

export default Page;
