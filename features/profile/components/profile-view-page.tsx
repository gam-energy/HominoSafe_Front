"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pencil, Save, Lock, X } from "lucide-react";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { LoaderIcon } from "@/components/chat/icons";
import { toast } from "sonner";

import { useUserProfile } from "../hook/useGetUser";
import { useUpdateProfile, UpdateProfileInput } from "../hook/useUpdateProfile";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "react-i18next";

const profileSchema = z.object({
  username: z.string().min(1, "Username is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  age: z.coerce.number().min(0, "Invalid age"),
  gender: z.string().min(1, "Gender is required"),
  weight: z.coerce.number().min(0, "Invalid weight"),
  height: z.coerce.number().min(0, "Invalid height"),
  bmi: z.number().optional(),
  bmi_category: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

type FieldItem = {
  label: string;
  name: keyof ProfileForm;
  type?: string;
  readOnly?: boolean;
};

export default function ProfileViewPage() {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const { user } = useUser();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      age: 0,
      gender: "",
      weight: 0,
      height: 0,
      bmi: undefined,
      bmi_category: undefined,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        age: profile.age ?? 0,
        gender: profile.gender || "",
        weight: profile.weight ?? 0,
        height: profile.height ?? 0,
        bmi: profile.bmi,
        bmi_category: profile.bmi_category,
      });
    }
  }, [profile]);

  const onSubmit = (data: ProfileForm) => {
    const updateData: UpdateProfileInput = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: user?.phone_number || "",
      dob: profile?.dob || new Date().toISOString(),
      gender: data.gender,
      weight: data.weight,
      height: data.height,
    };

    updateProfile(updateData, {
      onSuccess: () => {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      },
      onError: () => {
        toast.error("Failed to update profile.");
      },
    });
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderIcon />
      </div>
    );
  }

  const fields: FieldItem[] = [
    { label: "First Name", name: "first_name" },
    { label: "Last Name", name: "last_name" },
    { label: "Username", name: "username" },
    { label: "Email", name: "email", type: "email" },
    { label: "Age", name: "age", type: "number" },
    { label: "Gender", name: "gender" },
    { label: "Weight (kg)", name: "weight", type: "number" },
    { label: "Height (cm)", name: "height", type: "number" },
  ];

  return (
    <>
      <div className="w-full py-8 px-4 min-h-screen">
        <Card className="max-w-3xl mx-auto rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div className="rounded-full p-1 bg-white dark:bg-zinc-900 shadow-xl ring-4 ring-zinc-100 dark:ring-zinc-800">
              <Avatar className="w-28 h-28 rounded-full">
                <AvatarImage src="/avatar.jpg" alt="Avatar" />
                <AvatarFallback className="text-xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {profile?.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <CardHeader className="pt-16 text-center">
            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("account_settings", "Account Settings")}
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground">{t("manage_profile_desc", "Manage your personal information")}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-2 sm:px-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 mb-6">
                {t("personal_information", "Personal Information")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {fields.map(({ label, name, type, readOnly }) => (
                  <div key={name} className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">{label}</Label>

                    <Controller
                      control={form.control}
                      name={name}
                      render={({ field }) => {
                        if (name === "gender") {
                          return (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value as string}
                              disabled={!isEditing}
                            >
                              <SelectTrigger
                                className={cn(
                                  "w-full rounded-2xl px-4 py-2.5 shadow-sm transition-all border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/30 focus:ring-2 focus:ring-blue-500/50",
                                  !isEditing && "bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 cursor-not-allowed border-dashed"
                                )}
                              >
                                <SelectValue placeholder={t("select_gender", "Select Gender")} />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                <SelectItem value="Male">{t("male", "Male")}</SelectItem>
                                <SelectItem value="Female">{t("female", "Female")}</SelectItem>
                              </SelectContent>
                            </Select>
                          );
                        }

                        return (
                          <Input
                            {...field}
                            type={type || "text"}
                            className={cn(
                              "rounded-2xl px-4 py-2.5 shadow-sm transition-all border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/30 focus:ring-2 focus:ring-blue-500/50",
                              (!isEditing || readOnly) && "bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 cursor-not-allowed border-dashed"
                            )}
                          />
                        );
                      }}
                    />

                    {form.formState.errors[name] && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1">
                        {form.formState.errors[name]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4 mt-12 flex-wrap">
                {isEditing ? (
                  <>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-2.5 font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t("save", "Save")}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full px-8 py-2.5 font-bold border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset(profile);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" /> {t("cancel", "Cancel")}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full px-8 py-2.5 font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10 dark:shadow-white/10"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> {t("edit_profile", "Edit Profile")}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPasswordModal(true)}
                  className="rounded-full px-8 py-2.5 font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <Lock className="w-4 h-4 mr-2" /> {t("reset_password", "Reset Password")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}
