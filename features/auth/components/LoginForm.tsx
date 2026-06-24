"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema } from "../types/schema";
import { LoginFormValues, LoginFormProps } from "../types/auth";
import { useTranslation } from "react-i18next";

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-8 md:p-10 transition-all duration-300">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('welcome_back')}</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          {t('enter_credentials')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">{t('username')}</FormLabel>
                <FormControl>
                  <Input 
                    className="h-12 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                    dir="ltr" 
                    type="text" 
                    placeholder={t('username_placeholder')} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">{t('password')}</FormLabel>
                  <Link
                    href="/forget-password"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('forgot_password')}
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      className="h-12 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500/20 transition-all pr-12"
                      dir="ltr"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            disabled={isLoading}
            type="submit" 
            className="w-full h-12 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('signing_in')}
              </>
            ) : t('sign_in')}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-muted-foreground font-bold tracking-widest">{t('or')}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-gray-200 dark:border-zinc-800 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            onClick={() => router.push("/auth/sign-up")}
          >
            {t('create_account')}
          </Button>
        </form>
      </Form>
    </div>
  );
};
