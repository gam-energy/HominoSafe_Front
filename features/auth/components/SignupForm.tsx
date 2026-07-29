"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Package } from "lucide-react";
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
  type PatientRecordsMode,
  type CaregiverSignupValues,
  type PasswordDelivery,
} from "../types/auth";
import { cn } from "@/lib/utils";
import {
  getPasswordChecks,
  isValidPassword,
  isValidUsername,
} from "../lib/credentials";
import { useUsernameAvailability } from "../api/use-username-availability";
import { useSetupEligibility } from "@/features/orders/api/use-orders";
import { useEhrSeedPreview } from "@/features/applications/api/use-applications";

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
  const orderFromUrl = (searchParams.get("order") || "").trim();

  const initialRole: SignUpRole =
    roleFromUrl === "doctor" ? "doctor" : "patient";

  const [formData, setFormData] = useState<SignUpFormValues>({
    role: initialRole,
    patient_mode: "alone",
    records_mode: "ehr",
    ehr_code: "",
    order_number: orderFromUrl,
    password_delivery: "choose",
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [orderUnlocked, setOrderUnlocked] = useState(!!orderFromUrl);

  const eligibility = useSetupEligibility(
    formData.role === "patient" && orderUnlocked ? formData.order_number || null : null
  );

  useEffect(() => {
    if (!eligibility.data?.eligible) return;
    const d = eligibility.data;
    setFormData((prev) => ({
      ...prev,
      first_name: prev.first_name || d.first_name || "",
      last_name: prev.last_name || d.last_name || "",
      email: prev.email || d.email || "",
      national_code:
        prev.national_code ||
        (d.national_code && !String(d.national_code).startsWith("PENDING-")
          ? d.national_code
          : ""),
      dob: prev.dob || d.dob || "",
      gender: prev.gender || d.gender || "",
    }));
  }, [eligibility.data]);

  const usernameCheck = useUsernameAvailability(formData.username);
  const cgUsernameCheck = useUsernameAvailability(
    formData.caregiver?.username || ""
  );
  const passwordChecks = getPasswordChecks(formData.password);
  const recordsMode = formData.records_mode || "manual";
  const ehrPreview = useEhrSeedPreview(
    formData.role === "patient" && recordsMode === "ehr"
      ? formData.ehr_code || null
      : null
  );

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
      // Names come from EHR seed when records_mode is ehr.
      if (
        formData.role !== "patient" ||
        (formData.records_mode || "manual") === "manual"
      ) {
        errors.first_name = t("err_name_required");
      }
    }
    if (!formData.username.trim()) {
      errors.username = t("err_username_password_required");
    } else if (!isValidUsername(formData.username)) {
      errors.username = t("err_username_pattern");
    } else if (usernameCheck.status === "taken") {
      errors.username = t("err_username_taken");
    }

    if (!formData.email.trim()) {
      errors.email = t("err_email_required", "Email is required");
    }

    const delivery = formData.password_delivery || "choose";
    if (formData.role === "patient" && delivery === "email") {
      // Password fields not required — emailed later.
    } else {
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
    }

    if (formData.role === "patient") {
      if (!formData.order_number?.trim() || formData.order_number.trim().length < 4) {
        errors.order_number = t(
          "err_nest_order_required",
          "Buy Senio Nest and enter your paid order number before setup."
        );
      } else if (eligibility.isError || eligibility.data?.eligible === false) {
        errors.order_number = t(
          "err_nest_order_unpaid",
          "Complete Nest purchase (payment confirmed) before setting up your account."
        );
      }

      const mode = formData.records_mode || "manual";
      if (mode === "ehr") {
        const code = (formData.ehr_code || "").trim();
        if (!code || code.length < 4) {
          errors.ehr_code = t("err_ehr_code_required", "Enter a valid EHR code");
        } else if (ehrPreview.isError) {
          errors.ehr_code = t(
            "err_ehr_code_unknown",
            "Unknown EHR code — try EHR-DEMO-001"
          );
        } else if (ehrPreview.isFetching || ehrPreview.isLoading) {
          errors.ehr_code = t("err_ehr_code_checking", "Looking up EHR code…");
        } else if (!ehrPreview.data) {
          errors.ehr_code = t(
            "err_ehr_code_unknown",
            "Unknown EHR code — try EHR-DEMO-001"
          );
        }
      } else {
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
      if (!c.email?.trim()) {
        errors.cg_email = t(
          "err_cg_email_required",
          "Caregiver email is required — we email their password"
        );
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
  const nestReady = !isPatient || eligibility.data?.eligible === true;

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
          "Patients must buy Senio Nest first. Doctors can register independently."
        )}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {(
          [
            {
              role: "patient" as const,
              title: t("role_patient", "Patient"),
              hint: t("role_patient_hint", "Requires Nest purchase"),
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

      {isPatient && !nestReady && (
        <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {t("nest_required_title", "Buy Senio Nest before setup")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "nest_required_body",
                  "Patient accounts unlock only after a paid Nest order (€780). Order on the marketplace, then enter your order number here."
                )}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">
              {t("nest_order_number", "Nest order number")}
            </label>
            <Input
              name="order_number"
              dir="ltr"
              value={formData.order_number || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, order_number: value }));
                setOrderUnlocked(value.trim().length >= 4);
                setFieldErrors((prev) => {
                  if (!prev.order_number) return prev;
                  const next = { ...prev };
                  delete next.order_number;
                  return next;
                });
              }}
              placeholder="e.g. SN-XXXX"
            />
            {fieldErrors.order_number && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.order_number}</p>
            )}
            {eligibility.isFetching && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("checking_order", "Checking order…")}
              </p>
            )}
            {eligibility.isError && (
              <p className="text-xs text-destructive mt-1">
                {(eligibility.error as any)?.response?.data?.detail ||
                  t(
                    "err_nest_order_unpaid",
                    "Complete Nest purchase (payment confirmed) before setting up your account."
                  )}
              </p>
            )}
          </div>
          <Button asChild className="w-full">
            <Link href="/order">
              {t("buy_nest_cta", "Buy Senio Nest — €780")}
            </Link>
          </Button>
        </div>
      )}

      {isPatient && nestReady && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
          {t("nest_order_unlocked", "Nest order verified")}:{" "}
          <span className="font-mono font-semibold ltr-nums">
            {formData.order_number}
          </span>
        </div>
      )}

      {isPatient && nestReady && (
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

      {(!isPatient || nestReady) && (
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isPatient
            ? t("patient_account_section", "Patient account")
            : t("doctor_account_section", "Doctor account")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            (
              isPatient && recordsMode === "ehr"
                ? (["username", "email", "phone_number"] as const)
                : (["first_name", "last_name", "username", "email", "phone_number"] as const)
            )
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

          {isPatient && (
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm mb-1">
                {t("password_delivery_label", "How should we set your password?")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: "choose" as PasswordDelivery,
                      title: t("password_delivery_choose", "I will create my password"),
                      hint: t(
                        "password_delivery_choose_hint",
                        "Choose and confirm a password now"
                      ),
                    },
                    {
                      value: "email" as PasswordDelivery,
                      title: t("password_delivery_email", "Email me a password"),
                      hint: t(
                        "password_delivery_email_hint",
                        "We generate a secure password and send it to your email"
                      ),
                    },
                  ] as const
                ).map((opt) => {
                  const selected =
                    (formData.password_delivery || "choose") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          password_delivery: opt.value,
                          ...(opt.value === "email"
                            ? { password: "", confirmPassword: "" }
                            : {}),
                        }))
                      }
                      className={`rounded-xl border p-3 text-start transition ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <p className="text-sm font-medium">{opt.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {opt.hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(!isPatient ||
            (formData.password_delivery || "choose") === "choose") && (
            <>
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
                  <p className="text-[11px] text-red-500 mt-1">
                    {fieldErrors.password}
                  </p>
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
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </>
          )}

          {isPatient ? (
            <>
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-sm mb-1">
                  {t(
                    "records_mode_label",
                    "How should we fill your medical profile?"
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      {
                        value: "ehr" as PatientRecordsMode,
                        title: t("patient_mode_ehr", "EHR code"),
                        hint: t(
                          "patient_mode_ehr_hint_b2c",
                          "Enter a code — we load full demographics, diagnosis, allergies, and meds"
                        ),
                      },
                      {
                        value: "manual" as PatientRecordsMode,
                        title: t("patient_mode_manual", "Fill the form"),
                        hint: t(
                          "patient_mode_manual_hint_b2c",
                          "Enter your name, national code, DOB, and vitals yourself"
                        ),
                      },
                    ] as const
                  ).map((opt) => {
                    const selected = recordsMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            records_mode: opt.value,
                            ...(opt.value === "ehr"
                              ? {
                                  national_code: "",
                                  dob: "",
                                  gender: "",
                                  weight: "",
                                  height: "",
                                }
                              : { ehr_code: "" }),
                          }))
                        }
                        className={cn(
                          "rounded-xl border p-3 text-start transition",
                          selected
                            ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/30"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <p className="text-sm font-medium">{opt.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {opt.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {recordsMode === "ehr" ? (
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-sm mb-1">
                    {t("ehr_code", "EHR code")}
                  </label>
                  <Input
                    name="ehr_code"
                    dir="ltr"
                    value={formData.ehr_code || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ehr_code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="EHR-DEMO-001"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t(
                      "ehr_seed_hint",
                      "Demo codes: EHR-DEMO-001, EHR-DEMO-002, EHR-DEMO-003 — full medical seed data"
                    )}
                  </p>
                  {ehrPreview.isFetching && (
                    <p className="text-[11px] text-muted-foreground">
                      {t("checking_ehr", "Looking up…")}
                    </p>
                  )}
                  {ehrPreview.data && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-sm dark:bg-emerald-950/20">
                      <p className="font-semibold">
                        {ehrPreview.data.first_name} {ehrPreview.data.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        DOB {ehrPreview.data.dob} · {ehrPreview.data.gender}
                        {ehrPreview.data.diagnosis
                          ? ` · ${ehrPreview.data.diagnosis}`
                          : ""}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                        {t(
                          "ehr_seed_will_fill",
                          "Account will be created with this seed profile, including allergies and medications."
                        )}
                      </p>
                    </div>
                  )}
                  {fieldErrors.ehr_code && (
                    <p className="text-[11px] text-red-500">{fieldErrors.ehr_code}</p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm mb-1">
                      {t("national_code", "National / social-security code")}
                    </label>
                    <Input
                      name="national_code"
                      dir="ltr"
                      value={formData.national_code}
                      onChange={handleChange}
                      placeholder={t(
                        "national_code_patient_hint",
                        "Your personal ID — not a clinic or business code"
                      )}
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
                      <p className="text-[11px] text-red-500 mt-1">
                        {fieldErrors.dob}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      {t("gender", "Gender")}
                    </label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, gender: val }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("select_gender", "Select gender")}
                        />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover text-popover-foreground">
                        {genders.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.gender && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {fieldErrors.gender}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      {t("weight", "Weight (kg)")}{" "}
                      <span className="text-muted-foreground">
                        ({t("optional", "optional")})
                      </span>
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
                      <span className="text-muted-foreground">
                        ({t("optional", "optional")})
                      </span>
                    </label>
                    <Input
                      name="height"
                      dir="ltr"
                      value={formData.height || ""}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
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
                <SelectContent className="z-50 bg-popover text-popover-foreground">
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
            <p className="text-[11px] text-muted-foreground -mt-2">
              {t(
                "caregiver_password_email_hint",
                "We generate a password and email it to the caregiver. No password fields here."
              )}
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
                  {field === "email" && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t(
                        "cg_email_required_hint",
                        "Required — login password is sent here"
                      )}
                    </p>
                  )}
                  {fieldErrors[`cg_${field}`] && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {fieldErrors[`cg_${field}`]}
                    </p>
                  )}
                </div>
              ))}
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
                  <SelectContent className="z-50 bg-popover text-popover-foreground">
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
            (withCaregiver && cgUsernameCheck.status === "checking") ||
            (isPatient &&
              recordsMode === "ehr" &&
              (ehrPreview.isFetching || ehrPreview.isLoading))
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
      )}
    </div>
  );
};
