"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  relationships,
  specializations,
  type SignUpFormValues,
  type SignUpRole,
} from "../types/auth";
import { cn } from "@/lib/utils";

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => void;
  isPending?: boolean;
}

const RELATION_KEYS: Record<string, string> = {
  Parent: "rel_parent",
  Spouse: "rel_spouse",
  Sibling: "rel_sibling",
  Child: "rel_child",
  Friend: "rel_friend",
  Relative: "rel_relative",
  Caregiver: "rel_caregiver",
  Other: "rel_other",
};

const FIELD_KEYS: Record<string, string> = {
  first_name: "first_name",
  last_name: "last_name",
  username: "username",
  email: "email",
  phone_number: "phone_number",
};

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  isPending = false,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = (searchParams.get("code") || "").toUpperCase();
  const roleFromUrl = (searchParams.get("role") || "").toLowerCase();

  const initialRole: SignUpRole =
    roleFromUrl === "doctor" ? "doctor" : "caregiver";

  const [formData, setFormData] = useState<SignUpFormValues>({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    role: initialRole,
    relationship_to_user: "",
    specialization: "",
    referral_code: codeFromUrl,
  });

  useEffect(() => {
    if (codeFromUrl) {
      setFormData((prev) => ({ ...prev, referral_code: codeFromUrl }));
    }
  }, [codeFromUrl]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setRole = (role: SignUpRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      alert(t("err_username_password_required"));
      return;
    }
    if (formData.password.length < 8) {
      alert(t("err_password_min"));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert(t("err_password_mismatch"));
      return;
    }
    if (!formData.first_name || !formData.last_name) {
      alert(t("err_name_required"));
      return;
    }
    if (formData.role === "caregiver" && !formData.relationship_to_user) {
      alert(t("err_relationship_required"));
      return;
    }
    if (formData.role === "doctor" && !formData.specialization?.trim()) {
      alert(t("err_specialization_required", "Specialization is required"));
      return;
    }

    onSubmit({
      ...formData,
      referral_code: formData.referral_code.trim().toUpperCase(),
    });
  };

  const isCaregiver = formData.role === "caregiver";

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 md:p-10 mt-4 sm:mt-8">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {t("create_your_account", "Create your account")}
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {t(
          "signup_choose_role_subtitle",
          "Sign up as a caregiver on your own, or as an independent doctor (clinic optional later)."
        )}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {(
          [
            {
              role: "caregiver" as const,
              title: t("role_caregiver", "Caregiver"),
              hint: t("role_caregiver_hint", "Family or hired care"),
            },
            {
              role: "doctor" as const,
              title: t("role_doctor", "Doctor"),
              hint: t("role_doctor_hint", "No clinic required"),
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.role}
            type="button"
            onClick={() => setRole(opt.role)}
            className={cn(
              "rounded-xl border px-3 py-3 text-start transition-all",
              formData.role === opt.role
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-600"
                : "border-border hover:bg-muted/50"
            )}
          >
            <p className="text-sm font-semibold">{opt.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isCaregiver && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("doctor_referral_code")}{" "}
              <span className="text-muted-foreground font-normal">
                ({t("optional", "optional")})
              </span>
            </label>
            <Input
              name="referral_code"
              dir="ltr"
              value={formData.referral_code}
              onChange={handleChange}
              placeholder={t("referral_code_placeholder")}
              className="uppercase tracking-wider"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {t(
                "referral_optional_hint",
                "Have a doctor code? Enter it to link your account. Otherwise leave blank."
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            ["first_name", "last_name", "username", "email", "phone_number"] as const
          ).map((field) => (
            <div key={field}>
              <label className="block text-sm mb-1">{t(FIELD_KEYS[field])}</label>
              <Input
                name={field}
                dir="ltr"
                value={formData[field]}
                onChange={handleChange}
                placeholder={t(FIELD_KEYS[field])}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm mb-1">{t("password")}</label>
            <div className="relative">
              <Input
                name="password"
                dir="ltr"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder={t("enter_password")}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">{t("confirm_password")}</label>
            <div className="relative">
              <Input
                name="confirmPassword"
                dir="ltr"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword || ""}
                onChange={handleChange}
                placeholder={t("reenter_password")}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isCaregiver ? (
            <div>
              <label className="block text-sm mb-1">
                {t("relationship_to_patient")}
              </label>
              <Select
                value={formData.relationship_to_user}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, relationship_to_user: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_relationship")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 z-50">
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {t(RELATION_KEYS[rel] || rel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <label className="block text-sm mb-1">
                {t("specialization", "Specialization")}
              </label>
              <Select
                value={formData.specialization || ""}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, specialization: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("select_specialization", "Select specialization")}
                  />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 z-50">
                  {specializations.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t(
                  "doctor_no_clinic_hint",
                  "You can practice independently. A clinic can be assigned later."
                )}
              </p>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? t("creating_account")
            : isCaregiver
              ? t("create_caregiver_account")
              : t("create_doctor_account", "Create doctor account")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => router.push("/auth/sign-in")}
        >
          {t("already_have_account")} {t("sign_in")}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={() => router.push("/apply")}
        >
          {t(
            "prefer_clinic_apply",
            "Applying with a clinic and patient? Use clinic apply →"
          )}
        </Button>
      </form>
    </div>
  );
};
