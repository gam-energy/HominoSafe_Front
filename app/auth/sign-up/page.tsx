"use client";

import { Suspense } from "react";
import { SignUpForm } from "@/features/auth/components/SignupForm";
import { SignUpFormValues } from "@/features/auth/types/auth";
import { useSignup } from "@/features/auth/api/use-sign-up";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ModeToggle } from "@/components/layout/ThemeToggle/theme-toggle";

const SignUpInner = () => {
  const signup = useSignup();

  const handleSubmit = (values: SignUpFormValues) => {
    signup.mutate(values);
  };

  return (
    <section className="w-full min-h-screen flex flex-col justify-center items-center bg-secondary p-4 relative">
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
        <ModeToggle />
        <LanguageToggle />
      </div>
      <h1 className="relative hidden sm:block text-5xl font-extrabold text-white drop-shadow-md tracking-wide mb-4">
        SenioSentry
      </h1>
      <p className="sm:hidden mb-2 text-lg font-bold text-white">SenioSentry</p>
      <div className="w-full max-w-3xl flex justify-center items-center">
        <SignUpForm onSubmit={handleSubmit} isPending={signup.isPending} />
      </div>
    </section>
  );
};

const Page = () => (
  <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
    <SignUpInner />
  </Suspense>
);

export default Page;
