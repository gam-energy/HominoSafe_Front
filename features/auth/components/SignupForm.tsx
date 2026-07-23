"use client";

import React, { useState } from "react";
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
  genders,
  type SignUpFormValues,
  type SignUpRole,
  type PatientSignupMode,
  type CaregiverSignupValues,
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

const emptyCaregiver = (): CaregiverSignupValues => ({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone_number: "",
  first_name: "",
  last_name: "",
  relationship_to_patient: "",
});

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  isPending = false,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = (searchParams.get("role") || "").toLowerCase();

  const initialRole: SignUpRole =
    roleFromUrl === "doctor" ? "doctor" : "patient";

  const [formData, setFormData] = useState<SignUpFormValues>({
    role: initialRole,
    patient_mode: "alone",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    national_code: "",
    dob: "",
    gender: "",
    weight: "",
    height: "",
    specialization: "",
    caregiver: emptyCaregiver(),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCgPassword, setShowCgPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const usernameCheck = useUsernameAvailability(formData.username);
  const cgUsernameCheck = useUsernameAvailability(
    formData.caregiver?.username || ""
  );
  const passwordChecks = getPasswordChecks(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleCaregiverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      caregiver: { ...(prev.caregiver || emptyCaregiver()), [name]: value },
    }));
    const key = `cg_${name}`;
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setRole = (role: SignUpRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const setPatientMode = (patient_mode: PatientSignupMode) => {
    setFormData((prev) => ({
      ...prev,
      patient_mode,
      caregiver: prev.caregiver || emptyCaregiver(),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const withCg =
      formData.role === "patient" && formData.patient_mode === "with_caregiver";

    if (!formData.first_name || !formData.last_name) {
      errors.first_name = t("err_name_required");
    }
    if (!formData.username.trim()) {
      errors.username = t("err_username_password_required");
    } else if (!isValidUsername(formData.username)) {
      errors.username = t("err_username_pattern");
    } else if (usernameCheck.status === "taken") {
      errors.username = t("err_username_taken");
    }

    if (!formData.password) {
      errors.password = t("err_username_password_required");
    } else if (!isValidPassword(formData.password)) {
      errors.password = t("err_password_pattern");
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = t("err_username_password_required");
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("err_password_mismatch");
    }

    if (formData.role === "patient") {
      if (!formData.national_code.trim() || formData.national_code.trim().length < 5) {
        errors.national_code = t(
          "err_national_code_required",
          "National code is required (min 5 characters)"
        );
      }
      if (!formData.dob) {
        errors.dob = t("err_dob_required", "Date of birth is required");
      }
      if (!formData.gender) {
        errors.gender = t("err_gender_required", "Please select gender");
      }
    }

    if (formData.role === "doctor" && !formData.specialization?.trim()) {
      errors.specialization = t(
        "err_specialization_required",
        "Specialization is required"
      );
    }

    if (withCg && formData.caregiver) {
      const c = formData.caregiver;
      if (!c.first_name || !c.last_name) {
        errors.cg_first_name = t("err_name_required");
      }
      if (!c.username.trim()) {
        errors.cg_username = t("err_username_password_required");
      } else if (!isValidUsername(c.username)) {
        errors.cg_username = t("err_username_pattern");
      } else if (cgUsernameCheck.status === "taken") {
        errors.cg_username = t("err_username_taken");
      } else if (
        c.username.trim().toLowerCase() === formData.username.trim().toLowerCase()
      ) {
        errors.cg_username = t(
          "err_username_same",
          "Caregiver and patient usernames must differ."
        );
      }
      if (!c.password) {
        errors.cg_password = t("err_username_password_required");
      } else if (!isValidPassword(c.password)) {
        errors.cg_password = t("err_password_pattern");
      }
      if (c.password !== c.confirmPassword) {
        errors.cg_confirmPassword = t("err_password_mismatch");
      }
      if (!c.relationship_to_patient) {
        errors.cg_relationship = t("err_relationship_required");
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (usernameCheck.status === "checking") return;
    if (withCg && cgUsernameCheck.status === "checking") return;

    onSubmit(formData);
  };

  const isPatient = formData.role === "patient";
  const withCaregiver = isPatient && formData.patient_mode === "with_caregiver";

  const usernameHint =
    usernameCheck.status === "checking"
      ? t("username_checking")
      : usernameCheck.status === "available"
        ? t("username_available")
        : usernameCheck.status === "taken"
          ? t("err_username_taken")
          : usernameCheck.status === "invalid" && formData.username.trim()
            ? t("err_username_pattern")
            : null;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 md:p-10 mt-4 sm:mt-8">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {t("create_your_account", "Create your account")}
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {t(
          "signup_b2c_subtitle",
          "Register as a patient (alone or with a caregiver), or as an independent doctor."
        )}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {(
          [
            {
              role: "patient" as const,
              title: t("role_patient", "Patient"),
              hint: t("role_patient_hint", "B2C — alone or with caregiver"),
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

      {isPatient && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {(
            [
              {
                mode: "alone" as const,
                title: t("patient_mode_alone", "Patient alone"),
                hint: t("patient_mode_alone_hint", "No caregiver account"),
              },
              {
                mode: "with_caregiver" as const,
                title: t("patient_mode_with_cg", "With caregiver"),
                hint: t("patient_mode_with_cg_hint", "Create both accounts"),
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setPatientMode(opt.mode)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-start transition-all",
                formData.patient_mode === opt.mode
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <p className="text-sm font-semibold">{opt.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</p>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isPatient
            ? t("patient_account_section", "Patient account")
            : t("doctor_account_section", "Doctor account")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            ["first_name", "last_name", "username", "email", "phone_number"] as const
          ).map((field) => (
            <div key={field}>
              <label className="block text-sm mb-1">{t(field)}</label>
              <Input
                name={field}
                dir="ltr"
                value={formData[field]}
                onChange={handleChange}
                placeholder={t(field)}
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
                    ["length", t("pw_rule_length")],
                    ["upper", t("pw_rule_upper")],
                    ["lower", t("pw_rule_lower")],
                    ["digit", t("pw_rule_digit")],
                    ["special", t("pw_rule_special")],
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
                {t("err_password_pattern")}
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

          {isPatient ? (
            <>
              <div>
                <label className="block text-sm mb-1">
                  {t("national_code", "National code")}
                </label>
                <Input
                  name="national_code"
                  dir="ltr"
                  value={formData.national_code}
                  onChange={handleChange}
                />
                {fieldErrors.national_code && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {fieldErrors.national_code}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">
                  {t("date_of_birth", "Date of birth")}
                </label>
                <Input
                  name="dob"
                  type="date"
                  dir="ltr"
                  value={formData.dob}
                  onChange={handleChange}
                />
                {fieldErrors.dob && (
                  <p className="text-[11px] text-red-500 mt-1">{fieldErrors.dob}</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">{t("gender", "Gender")}</label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, gender: val }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("select_gender", "Select gender")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 z-50">
                    {genders.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.gender && (
                  <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gender}</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">
                  {t("weight", "Weight (kg)")}{" "}
                  <span className="text-muted-foreground">({t("optional", "optional")})</span>
                </label>
                <Input
                  name="weight"
                  dir="ltr"
                  value={formData.weight || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  {t("height", "Height (cm)")}{" "}
                  <span className="text-muted-foreground">({t("optional", "optional")})</span>
                </label>
                <Input
                  name="height"
                  dir="ltr"
                  value={formData.height || ""}
                  onChange={handleChange}
                />
              </div>
            </>
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

        {withCaregiver && formData.caregiver && (
          <div className="space-y-4 border-t pt-4 mt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("caregiver_account_section", "Caregiver account")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  "first_name",
                  "last_name",
                  "username",
                  "email",
                  "phone_number",
                ] as const
              ).map((field) => (
                <div key={`cg_${field}`}>
                  <label className="block text-sm mb-1">{t(field)}</label>
                  <Input
                    name={field}
                    dir="ltr"
                    value={formData.caregiver![field]}
                    onChange={handleCaregiverChange}
                  />
                  {field === "username" && cgUsernameCheck.status === "available" && (
                    <p className="text-[11px] text-emerald-600 mt-1">
                      {t("username_available")}
                    </p>
                  )}
                  {fieldErrors[`cg_${field}`] && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {fieldErrors[`cg_${field}`]}
                    </p>
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm mb-1">{t("password")}</label>
                <div className="relative">
                  <Input
                    name="password"
                    dir="ltr"
                    type={showCgPassword ? "text" : "password"}
                    value={formData.caregiver.password}
                    onChange={handleCaregiverChange}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCgPassword(!showCgPassword)}
                    className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showCgPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.cg_password && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {fieldErrors.cg_password}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">{t("confirm_password")}</label>
                <Input
                  name="confirmPassword"
                  dir="ltr"
                  type="password"
                  value={formData.caregiver.confirmPassword || ""}
                  onChange={handleCaregiverChange}
                />
                {fieldErrors.cg_confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {fieldErrors.cg_confirmPassword}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">
                  {t("relationship_to_patient")}
                </label>
                <Select
                  value={formData.caregiver.relationship_to_patient}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      caregiver: {
                        ...(prev.caregiver || emptyCaregiver()),
                        relationship_to_patient: val,
                      },
                    }))
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
                {fieldErrors.cg_relationship && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {fieldErrors.cg_relationship}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            isPending ||
            usernameCheck.status === "checking" ||
            (withCaregiver && cgUsernameCheck.status === "checking")
          }
        >
          {isPending
            ? t("creating_account")
            : isPatient
              ? withCaregiver
                ? t("create_patient_caregiver_accounts", "Create patient & caregiver")
                : t("create_patient_account", "Create patient account")
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
