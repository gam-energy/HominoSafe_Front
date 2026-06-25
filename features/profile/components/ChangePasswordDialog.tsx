"use client";

import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoaderIcon } from "@/components/chat/icons";
import { ResetPasswordInput, useResetPassword } from "../hook/useResetPassword";

const passwordSchema = z.object({
  current_password: z.string().min(6, "Current password is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
});

type PasswordForm = z.infer<typeof passwordSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ChangePasswordDialog({ open, onClose }: Props) {
  const { mutate: resetPassword, isLoading } = useResetPassword();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    defaultValues: {
      current_password: "",
      new_password: "",
    },
  });

const handleSubmit = (data: PasswordForm) => {
  // assert data is ResetPasswordInput
  resetPassword(data as ResetPasswordInput, {
    onSuccess: () => {
      toast.success("Password changed successfully!");
      form.reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to change password.");
    },
  });
};


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Change Password</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-4">
          {/* Current password */}
          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Current Password
            </Label>

            <Controller
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <Input
                  id="current_password"
                  type="password"
                  placeholder="Enter current password"
                  className="rounded-2xl px-4 py-2.5 shadow-sm transition-all border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/30 focus:ring-2 focus:ring-blue-500/50"
                  {...field}
                />
              )}
            />

            {form.formState.errors.current_password && (
              <p className="text-[10px] font-bold text-rose-500 mt-1">
                {form.formState.errors.current_password.message}
              </p>
            )}
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              New Password
            </Label>

            <Controller
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Enter new password"
                  className="rounded-2xl px-4 py-2.5 shadow-sm transition-all border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/30 focus:ring-2 focus:ring-blue-500/50"
                  {...field}
                />
              )}
            />

            {form.formState.errors.new_password && (
              <p className="text-[10px] font-bold text-rose-500 mt-1">
                {form.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-3 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full px-6 font-bold border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {isLoading && <LoaderIcon />}
              Change Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
