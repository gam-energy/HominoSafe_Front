"use client";

import { SignUpForm } from "@/features/auth/components/SignupForm";
import { SignUpFormValues } from "@/features/auth/types/auth";
import { useSignup } from "@/features/auth/api/use-sign-up";



const Page = () => {
  // const SignupMutation = useSignup()

  const handleSubmit = async (values: any) => {
      const finalPayload = {
      ...values,
      assigned_patients: [0],
    };
    
    // SignupMutation.mutate(finalPayload)
    console.log(finalPayload);
    
  };

  return (
    <section className="w-full h-screen flex flex-col justify-center items-center bg-secondary">
        <h1 className="relative hidden sm:block top-10 text-5xl font-extrabold text-white drop-shadow-md tracking-wide">
        SennioSentry
        </h1>
      <div className="w-5/6 lg:w-3/5 h-full flex justify-center items-center">
        {/* <SignUpForm onSubmit={handleSubmit}/> */}
        <SignUpForm onSubmit={handleSubmit}/>
      </div>
    </section>
  );
};

export default Page;
