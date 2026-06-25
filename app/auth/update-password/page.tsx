"use client";

import UpdatePasswordForm from "@/features/auth/components/UpdatePasswordForm";


const Page = () => {

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center bg-secondary px-4 py-10">
        <h1 className="relative top-10 text-5xl font-extrabold text-white drop-shadow-md tracking-wide">
        SenioSentry
        </h1>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 sm:p-8">
        <UpdatePasswordForm />
      </div>
    </section>
  );
};

export default Page;
