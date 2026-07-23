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
import {
  getPasswordChecks,
  isValidPassword,
  isValidUsername,
} from "../lib/credentials";
import { useUsernameAvailability } from "../api/use-username-availability";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const usernameCheck = useUsernameAvailability(formData.username);
  const passwordChecks = getPasswordChecks(formData.password);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setRole = (role: SignUpRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = t("err_username_password_required");
    } else if (!isValidUsername(formData.username)) {
      errors.username = t(
        "err_username_pattern",
        "Username must start with a letter and use only letters, digits, dots, underscores, or hyphens (3–50 chars)."
      );
    } else if (usernameCheck.status === "taken") {
      errors.username = t("err_username_taken", "Username is already taken.");
    }

    if (!formData.password) {
      errors.password = t("err_username_password_required");
    } else if (!isValidPassword(formData.password)) {
      errors.password = t(
        "err_password_pattern",
        "Password must be 8–64 characters and include uppercase, lowercase, a number, and a special character."
      );
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t("err_username_password_required");
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("err_password_mismatch");
    }

    if (!formData.first_name || !formData.last_name) {
      errors.first_name = t("err_name_required");
    }
    if (formData.role === "caregiver" && !formData.relationship_to_user) {
      errors.relationship_to_user = t("err_relationship_required");
    }
    if (formData.role === "doctor" && !formData.specialization?.trim()) {
      errors.specialization = t(
        "err_specialization_required",
        "Specialization is required"
      );
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (usernameCheck.status === "checking") return;

    onSubmit({
      ...formData,
      referral_code: formData.referral_code.trim().toUpperCase(),
    });
  };

  const isCaregiver = formData.role === "caregiver";
  const usernameHint =
    usernameCheck.status === "checking"
      ? t("username_checking", "Checking username…")
      : usernameCheck.status === "available"
        ? t("username_available", "Username is available")
        : usernameCheck.status === "taken"
          ? t("err_username_taken", "Username is already taken.")
          : usernameCheck.status === "invalid" && formData.username.trim()
            ? t(
                "err_username_pattern",
                "Username must start with a letter and use only letters, digits, dots, underscores, or hyphens (3–50 chars)."
              )
            : null;

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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                aria-invalid={Boolean(fieldErrors[field])}
                className={cn(
                  field === "username" &&
                    usernameCheck.status === "taken" &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {field === "username" && usernameHint && (
                <p
                  className={cn(
                    "text-[11px] mt-1",
                    usernameCheck.status === "available"
                      ? "text-emerald-600"
                      : usernameCheck.status === "checking"
                        ? "text-muted-foreground"
                        : "text-red-500"
                  )}
                >
                  {usernameHint}
                </p>
              )}
              {fieldErrors[field] && (
                <p className="text-[11px] text-red-500 mt-1">{fieldErrors[field]}</p>
              )}
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
                aria-invalid={Boolean(fieldErrors.password)}
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
            {formData.password ? (
              <ul className="mt-1.5 space-y-0.5 text-[11px]">
                {(
                  [
                    ["length", t("pw_rule_length", "At least 8 characters")],
                    ["upper", t("pw_rule_upper", "One uppercase letter")],
                    ["lower", t("pw_rule_lower", "One lowercase letter")],
                    ["digit", t("pw_rule_digit", "One number")],
                    ["special", t("pw_rule_special", "One special character")],
                  ] as const
                ).map(([key, label]) => (
                  <li
                    key={key}
                    className={
                      passwordChecks[key]
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }
                  >
                    {passwordChecks[key] ? "✓" : "○"} {label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                {t(
                  "err_password_pattern",
                  "Password must be 8–64 characters and include uppercase, lowercase, a number, and a special character."
                )}
              </p>
            )}
            {fieldErrors.password && (
              <p className="text-[11px] text-red-500 mt-1">{fieldErrors.password}</p>
            )}
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
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
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
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
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
              {fieldErrors.relationship_to_user && (
                <p className="text-[11px] text-red-500 mt-1">
                  {fieldErrors.relationship_to_user}
                </p>
              )}
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
              {fieldErrors.specialization && (
                <p className="text-[11px] text-red-500 mt-1">
                  {fieldErrors.specialization}
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || usernameCheck.status === "checking"}
        >
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
