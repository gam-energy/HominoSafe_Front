"use client";

import { Suspense } from "react";
import { SignUpForm } from "@/features/auth/components/SignupForm";
import { AuthBrand } from "@/features/auth/components/AuthBrand";
import { SignUpFormValues } from "@/features/auth/types/auth";
import { useSignup } from "@/features/auth/api/use-sign-up";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ModeToggle } from "@/components/layout/ThemeToggle/theme-toggle";
import { Loader2 } from "lucide-react";

const SignUpInner = () => {
  const signup = useSignup();

  const handleSubmit = (values: SignUpFormValues) => {
    signup.mutate(values);
  };

  return (
    <section
      style={{ paddingTop: "calc(1rem + var(--app-sat, 0px))" }}
      className="w-full min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-zinc-950 p-4 relative overflow-hidden"
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

      <div className="relative z-10 w-full max-w-3xl flex justify-center items-center">
        <SignUpForm onSubmit={handleSubmit} isPending={signup.isPending} />
      </div>
    </section>
  );
};

const Page = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }
  >
    <SignUpInner />
  </Suspense>
);

export default Page;
