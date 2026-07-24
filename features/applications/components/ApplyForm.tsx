'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { relationships } from '@/features/auth/types/auth';
import { isValidPassword, isValidUsername } from '@/features/auth/lib/credentials';
import { useUsernameAvailability } from '@/features/auth/api/use-username-availability';
import { useCreateApplication, useClinicDoctors, usePublicClinics, useEhrSeedPreview } from '../api/use-applications';
import { GENDERS, type Gender } from '../types/applications';
import { cn } from '@/lib/utils';

const RELATION_KEYS: Record<string, string> = {
  Parent: 'rel_parent',
  Spouse: 'rel_spouse',
  Sibling: 'rel_sibling',
  Child: 'rel_child',
  Friend: 'rel_friend',
  Relative: 'rel_relative',
  Caregiver: 'rel_caregiver',
  Other: 'rel_other',
};

type FormState = {
  includeCaregiver: boolean;
  patientMode: 'ehr' | 'manual';
  caregiver: {
    username: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    relationship_to_patient: string;
  };
  patient: {
    username: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    ehr_code: string;
    national_code: string;
    dob: string;
    gender: Gender | '';
    weight: string;
    height: string;
  };
  clinic_id: number | null;
  doctor_id: number | null;
};

const initialForm: FormState = {
  includeCaregiver: false,
  patientMode: 'ehr',
  caregiver: {
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    relationship_to_patient: '',
  },
  patient: {
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    ehr_code: '',
    national_code: '',
    dob: '',
    gender: '',
    weight: '',
    height: '',
  },
  clinic_id: null,
  doctor_id: null,
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pe-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function ApplyForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: clinics, isLoading: clinicsLoading, error: clinicsError } = usePublicClinics();
  const createApp = useCreateApplication();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState({
    cg: false,
    cgConfirm: false,
    pt: false,
    ptConfirm: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const cgUsernameCheck = useUsernameAvailability(
    form.includeCaregiver ? form.caregiver.username : ''
  );
  const ptUsernameCheck = useUsernameAvailability(form.patient.username);
  const ehrPreview = useEhrSeedPreview(
    form.patientMode === 'ehr' ? form.patient.ehr_code || null : null
  );

  const steps = useMemo(() => {
    return form.includeCaregiver
      ? (['caregiver', 'patient', 'clinic'] as const)
      : (['patient', 'clinic'] as const);
  }, [form.includeCaregiver]);
  const activeStepKey = steps[step] ?? 'patient';

  const {
    data: doctors,
    isLoading: doctorsLoading,
    error: doctorsError,
  } = useClinicDoctors(form.clinic_id);

  const selectedClinic = useMemo(
    () => clinics?.find((c) => c.id === form.clinic_id) ?? null,
    [clinics, form.clinic_id]
  );

  const selectedDoctor = useMemo(
    () => doctors?.find((d) => d.id === form.doctor_id) ?? null,
    [doctors, form.doctor_id]
  );

  const setCaregiver = (key: keyof FormState['caregiver'], value: string) => {
    setForm((prev) => ({
      ...prev,
      caregiver: { ...prev.caregiver, [key]: value },
    }));
  };

  const setPatient = (key: keyof FormState['patient'], value: string) => {
    setForm((prev) => ({
      ...prev,
      patient: { ...prev.patient, [key]: value },
    }));
  };

  const validateCaregiver = (): boolean => {
    const e: Record<string, string> = {};
    const c = form.caregiver;
    if (!c.first_name.trim()) e.cg_first_name = t('err_name_required');
    if (!c.last_name.trim()) e.cg_last_name = t('err_name_required');
    if (!c.username.trim()) e.cg_username = t('err_username_password_required');
    else if (!isValidUsername(c.username)) e.cg_username = t('err_username_pattern');
    else if (cgUsernameCheck.status === 'taken') e.cg_username = t('err_username_taken');
    if (!c.password) e.cg_password = t('err_username_password_required');
    else if (!isValidPassword(c.password)) e.cg_password = t('err_password_pattern');
    if (c.password !== c.confirmPassword) e.cg_confirm = t('err_password_mismatch');
    if (!c.relationship_to_patient) e.cg_rel = t('err_relationship_required');
    if (!c.email.trim()) e.cg_email = t('err_email_required', 'Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) {
      e.cg_email = t('err_email_invalid', 'Enter a valid email');
    }
    if (!c.phone_number.trim() || c.phone_number.trim().length < 5) {
      e.cg_phone = t('err_phone_required', 'Phone number is required');
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePatient = (): boolean => {
    const e: Record<string, string> = {};
    const p = form.patient;
    if (!p.username.trim()) e.pt_username = t('err_username_password_required');
    else if (!isValidUsername(p.username)) e.pt_username = t('err_username_pattern');
    else if (ptUsernameCheck.status === 'taken') e.pt_username = t('err_username_taken');
    else if (
      form.includeCaregiver &&
      p.username.trim().toLowerCase() === form.caregiver.username.trim().toLowerCase()
    ) {
      e.pt_username = t('err_username_same', 'Caregiver and patient usernames must differ.');
    }
    if (!p.password) e.pt_password = t('err_username_password_required');
    else if (!isValidPassword(p.password)) e.pt_password = t('err_password_pattern');
    if (p.password !== p.confirmPassword) e.pt_confirm = t('err_password_mismatch');
    if (!p.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) {
      e.pt_email = t('err_email_required', 'Email is required');
    }
    if (!p.phone_number.trim() || p.phone_number.trim().length < 5) {
      e.pt_phone = t('err_phone_required', 'Phone number is required');
    }

    if (form.patientMode === 'ehr') {
      if (!p.ehr_code.trim() || p.ehr_code.trim().length < 4) {
        e.pt_ehr = t('err_ehr_code_required', 'Enter a valid EHR code');
      } else if (ehrPreview.isError) {
        e.pt_ehr = t('err_ehr_code_unknown', 'Unknown EHR code — try EHR-DEMO-001');
      } else if (ehrPreview.isFetching || !ehrPreview.data) {
        e.pt_ehr = t('err_ehr_code_checking', 'Looking up EHR code…');
      }
    } else {
      if (!p.first_name.trim()) e.pt_first_name = t('err_name_required');
      if (!p.last_name.trim()) e.pt_last_name = t('err_name_required');
      if (
        !p.national_code.trim() ||
        p.national_code.trim().length < 5 ||
        !/^[a-zA-Z0-9]+$/.test(p.national_code.trim())
      ) {
        e.pt_national = t(
          'err_national_code_required',
          'National code is required (min 5 alphanumeric characters)'
        );
      }
      if (!p.dob) e.pt_dob = t('err_dob_required', 'Date of birth is required');
      if (!p.gender) e.pt_gender = t('err_gender_required', 'Please select gender');
      if (p.weight && Number.isNaN(Number(p.weight)))
        e.pt_weight = t('err_number_invalid', 'Enter a valid number');
      if (p.height && Number.isNaN(Number(p.height)))
        e.pt_height = t('err_number_invalid', 'Enter a valid number');
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateClinic = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.clinic_id) e.clinic = t('err_clinic_required', 'Please select a clinic');
    if (!form.doctor_id) e.doctor = t('err_doctor_required', 'Please select your doctor');
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (activeStepKey === 'caregiver' && !validateCaregiver()) return;
    if (activeStepKey === 'patient' && !validatePatient()) return;
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => {
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateClinic() || !form.clinic_id || !form.doctor_id) return;
    if (form.patientMode === 'manual' && !form.patient.gender) return;

    const patientPayload =
      form.patientMode === 'ehr'
        ? {
            username: form.patient.username.trim(),
            password: form.patient.password,
            email: form.patient.email.trim(),
            phone_number: form.patient.phone_number.trim(),
            ehr_code: form.patient.ehr_code.trim().toUpperCase(),
          }
        : {
            username: form.patient.username.trim(),
            password: form.patient.password,
            email: form.patient.email.trim(),
            phone_number: form.patient.phone_number.trim(),
            first_name: form.patient.first_name.trim(),
            last_name: form.patient.last_name.trim(),
            national_code: form.patient.national_code.trim(),
            dob: form.patient.dob,
            gender: form.patient.gender as Gender,
            ...(form.patient.weight ? { weight: Number(form.patient.weight) } : {}),
            ...(form.patient.height ? { height: Number(form.patient.height) } : {}),
          };

    const payload = {
      clinic_id: form.clinic_id,
      doctor_id: form.doctor_id,
      patient: patientPayload,
      ...(form.includeCaregiver
        ? {
            caregiver: {
              username: form.caregiver.username.trim(),
              password: form.caregiver.password,
              first_name: form.caregiver.first_name.trim(),
              last_name: form.caregiver.last_name.trim(),
              relationship_to_patient: form.caregiver.relationship_to_patient,
              email: form.caregiver.email.trim(),
              phone_number: form.caregiver.phone_number.trim(),
            },
          }
        : {}),
    };

    try {
      await createApp.mutateAsync(payload);
      setSubmitted(true);
      toast.success(t('app_submit_success', 'Application submitted successfully'));
      setTimeout(() => {
        router.push(
          `/auth/sign-in?message=${encodeURIComponent('application_submitted')}`
        );
      }, 1200);
    } catch {
      // toast handled in mutation
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h2 className="text-xl font-bold">{t('app_submit_success_title', 'Application submitted')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('app_submit_success_body', 'Redirecting you to sign in…')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({ ...prev, includeCaregiver: false }));
            setStep(0);
          }}
          className={cn(
            'rounded-xl border px-3 py-3 text-start transition-all',
            !form.includeCaregiver
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'hover:bg-muted/50'
          )}
        >
          <p className="text-sm font-semibold">
            {t('apply_alone', 'Patient only')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t('apply_alone_hint', 'No caregiver account — you can request one later')}
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({ ...prev, includeCaregiver: true }));
            setStep(0);
          }}
          className={cn(
            'rounded-xl border px-3 py-3 text-start transition-all',
            form.includeCaregiver
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'hover:bg-muted/50'
          )}
        >
          <p className="text-sm font-semibold">
            {t('apply_with_caregiver', 'With caregiver')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t('apply_with_caregiver_hint', 'Create patient and caregiver together')}
          </p>
        </button>
      </div>

      <nav className="mb-8 flex items-center justify-between gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                i === step && 'bg-primary text-primary-foreground',
                i < step && 'bg-emerald-500 text-white',
                i > step && 'bg-muted text-muted-foreground'
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                i === step ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {t(`app_step_${s}`, s)}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 hidden h-px flex-1 bg-border sm:block" aria-hidden />
            )}
          </div>
        ))}
      </nav>

      {activeStepKey === 'caregiver' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t('app_step_caregiver', 'Caregiver account')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('app_step_caregiver_desc', 'Create your caregiver login and contact details.')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cg_first_name">{t('first_name')}</Label>
              <Input
                id="cg_first_name"
                value={form.caregiver.first_name}
                onChange={(e) => setCaregiver('first_name', e.target.value)}
              />
              {fieldErrors.cg_first_name && (
                <p className="text-xs text-destructive">{fieldErrors.cg_first_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_last_name">{t('last_name')}</Label>
              <Input
                id="cg_last_name"
                value={form.caregiver.last_name}
                onChange={(e) => setCaregiver('last_name', e.target.value)}
              />
              {fieldErrors.cg_last_name && (
                <p className="text-xs text-destructive">{fieldErrors.cg_last_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_username">{t('username')}</Label>
              <Input
                id="cg_username"
                dir="ltr"
                value={form.caregiver.username}
                onChange={(e) => setCaregiver('username', e.target.value)}
                autoComplete="username"
              />
              {cgUsernameCheck.status === 'available' && (
                <p className="text-xs text-emerald-600">{t('username_available')}</p>
              )}
              {cgUsernameCheck.status === 'checking' && (
                <p className="text-xs text-muted-foreground">{t('username_checking')}</p>
              )}
              {(fieldErrors.cg_username || cgUsernameCheck.status === 'taken') && (
                <p className="text-xs text-destructive">
                  {fieldErrors.cg_username || t('err_username_taken')}
                </p>
              )}
              {cgUsernameCheck.status === 'invalid' && form.caregiver.username.trim() && !fieldErrors.cg_username && (
                <p className="text-xs text-destructive">{t('err_username_pattern')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_email">{t('email')}</Label>
              <Input
                id="cg_email"
                dir="ltr"
                type="email"
                value={form.caregiver.email}
                onChange={(e) => setCaregiver('email', e.target.value)}
                required
              />
              {fieldErrors.cg_email && (
                <p className="text-xs text-destructive">{fieldErrors.cg_email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_phone">{t('phone_number')}</Label>
              <Input
                id="cg_phone"
                dir="ltr"
                value={form.caregiver.phone_number}
                onChange={(e) => setCaregiver('phone_number', e.target.value)}
                required
              />
              {fieldErrors.cg_phone && (
                <p className="text-xs text-destructive">{fieldErrors.cg_phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('relationship_to_patient')}</Label>
              <Select
                value={form.caregiver.relationship_to_patient}
                onValueChange={(v) => setCaregiver('relationship_to_patient', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select_relationship')} />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {t(RELATION_KEYS[rel] || rel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.cg_rel && (
                <p className="text-xs text-destructive">{fieldErrors.cg_rel}</p>
              )}
            </div>
            <PasswordField
              id="cg_password"
              label={t('password')}
              value={form.caregiver.password}
              onChange={(v) => setCaregiver('password', v)}
              show={showPw.cg}
              onToggle={() => setShowPw((s) => ({ ...s, cg: !s.cg }))}
              placeholder={t('enter_password')}
            />
            {fieldErrors.cg_password && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.cg_password}</p>
            )}
            <PasswordField
              id="cg_confirm"
              label={t('confirm_password')}
              value={form.caregiver.confirmPassword}
              onChange={(v) => setCaregiver('confirmPassword', v)}
              show={showPw.cgConfirm}
              onToggle={() => setShowPw((s) => ({ ...s, cgConfirm: !s.cgConfirm }))}
              placeholder={t('reenter_password')}
            />
            {fieldErrors.cg_confirm && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.cg_confirm}</p>
            )}
          </div>
        </div>
      )}

      {activeStepKey === 'patient' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t('app_step_patient', 'Patient profile')}</h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'app_step_patient_desc',
                'Create patient credentials. Prefer EHR code to fill the medical profile from seed data.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, patientMode: 'ehr' }))}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-start text-sm',
                form.patientMode === 'ehr'
                  ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/30'
                  : 'hover:bg-muted/50'
              )}
            >
              <p className="font-semibold">{t('patient_mode_ehr', 'EHR code')}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('patient_mode_ehr_hint', 'Code + username, email, phone, password')}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, patientMode: 'manual' }))}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-start text-sm',
                form.patientMode === 'manual'
                  ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/30'
                  : 'hover:bg-muted/50'
              )}
            >
              <p className="font-semibold">{t('patient_mode_manual', 'Manual profile')}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('patient_mode_manual_hint', 'Enter demographics yourself')}
              </p>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {form.patientMode === 'ehr' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pt_ehr">{t('ehr_code', 'EHR code')}</Label>
                <Input
                  id="pt_ehr"
                  dir="ltr"
                  value={form.patient.ehr_code}
                  onChange={(e) => setPatient('ehr_code', e.target.value.toUpperCase())}
                  placeholder="EHR-DEMO-001"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'ehr_seed_hint',
                    'No live EHR connection — demo codes: EHR-DEMO-001, EHR-DEMO-002, EHR-DEMO-003'
                  )}
                </p>
                {ehrPreview.isFetching && (
                  <p className="text-xs text-muted-foreground">{t('checking_ehr', 'Looking up…')}</p>
                )}
                {ehrPreview.data && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-sm dark:bg-emerald-950/20">
                    <p className="font-semibold">
                      {ehrPreview.data.first_name} {ehrPreview.data.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      DOB {ehrPreview.data.dob} · {ehrPreview.data.gender}
                      {ehrPreview.data.diagnosis ? ` · ${ehrPreview.data.diagnosis}` : ''}
                    </p>
                  </div>
                )}
                {fieldErrors.pt_ehr && (
                  <p className="text-xs text-destructive">{fieldErrors.pt_ehr}</p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="pt_first_name">{t('first_name')}</Label>
                  <Input
                    id="pt_first_name"
                    value={form.patient.first_name}
                    onChange={(e) => setPatient('first_name', e.target.value)}
                  />
                  {fieldErrors.pt_first_name && (
                    <p className="text-xs text-destructive">{fieldErrors.pt_first_name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pt_last_name">{t('last_name')}</Label>
                  <Input
                    id="pt_last_name"
                    value={form.patient.last_name}
                    onChange={(e) => setPatient('last_name', e.target.value)}
                  />
                  {fieldErrors.pt_last_name && (
                    <p className="text-xs text-destructive">{fieldErrors.pt_last_name}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pt_username">{t('username')}</Label>
              <Input
                id="pt_username"
                dir="ltr"
                value={form.patient.username}
                onChange={(e) => setPatient('username', e.target.value)}
                autoComplete="username"
              />
              {ptUsernameCheck.status === 'available' && (
                <p className="text-xs text-emerald-600">{t('username_available')}</p>
              )}
              {(fieldErrors.pt_username || ptUsernameCheck.status === 'taken') && (
                <p className="text-xs text-destructive">
                  {fieldErrors.pt_username || t('err_username_taken')}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_email">{t('email')}</Label>
              <Input
                id="pt_email"
                dir="ltr"
                type="email"
                value={form.patient.email}
                onChange={(e) => setPatient('email', e.target.value)}
                required
              />
              {fieldErrors.pt_email && (
                <p className="text-xs text-destructive">{fieldErrors.pt_email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_phone">{t('phone_number')}</Label>
              <Input
                id="pt_phone"
                dir="ltr"
                value={form.patient.phone_number}
                onChange={(e) => setPatient('phone_number', e.target.value)}
                required
              />
              {fieldErrors.pt_phone && (
                <p className="text-xs text-destructive">{fieldErrors.pt_phone}</p>
              )}
            </div>

            {form.patientMode === 'manual' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="pt_national">{t('national_code', 'National code')}</Label>
                  <Input
                    id="pt_national"
                    dir="ltr"
                    value={form.patient.national_code}
                    onChange={(e) => setPatient('national_code', e.target.value)}
                  />
                  {fieldErrors.pt_national && (
                    <p className="text-xs text-destructive">{fieldErrors.pt_national}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pt_dob">{t('date_of_birth', 'Date of birth')}</Label>
                  <Input
                    id="pt_dob"
                    type="date"
                    dir="ltr"
                    value={form.patient.dob}
                    onChange={(e) => setPatient('dob', e.target.value)}
                  />
                  {fieldErrors.pt_dob && (
                    <p className="text-xs text-destructive">{fieldErrors.pt_dob}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>{t('gender', 'Gender')}</Label>
                  <Select
                    value={form.patient.gender}
                    onValueChange={(v) => setPatient('gender', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('select_gender', 'Select gender')} />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.pt_gender && (
                    <p className="text-xs text-destructive">{fieldErrors.pt_gender}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pt_weight">{t('weight', 'Weight (kg)')}</Label>
                  <Input
                    id="pt_weight"
                    dir="ltr"
                    value={form.patient.weight}
                    onChange={(e) => setPatient('weight', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pt_height">{t('height', 'Height (cm)')}</Label>
                  <Input
                    id="pt_height"
                    dir="ltr"
                    value={form.patient.height}
                    onChange={(e) => setPatient('height', e.target.value)}
                  />
                </div>
              </>
            )}

            <PasswordField
              id="pt_password"
              label={t('password')}
              value={form.patient.password}
              onChange={(v) => setPatient('password', v)}
              show={showPw.pt}
              onToggle={() => setShowPw((s) => ({ ...s, pt: !s.pt }))}
            />
            {fieldErrors.pt_password && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.pt_password}</p>
            )}
            <PasswordField
              id="pt_confirm"
              label={t('confirm_password')}
              value={form.patient.confirmPassword}
              onChange={(v) => setPatient('confirmPassword', v)}
              show={showPw.ptConfirm}
              onToggle={() => setShowPw((s) => ({ ...s, ptConfirm: !s.ptConfirm }))}
            />
            {fieldErrors.pt_confirm && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.pt_confirm}</p>
            )}
          </div>
        </div>
      )}

      {activeStepKey === 'clinic' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t('app_step_clinic', 'Clinic & doctor')}</h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'app_step_clinic_desc',
                'Choose your clinic, then select your doctor and confirm.'
              )}
            </p>
          </div>

          {clinicsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading_clinics', 'Loading clinics…')}
            </div>
          )}
          {clinicsError && (
            <p className="text-sm text-destructive">
              {t('err_load_clinics', 'Could not load clinics. Please try again.')}
            </p>
          )}

          <div className="grid gap-3">
            {(clinics ?? []).map((clinic) => {
              const selected = form.clinic_id === clinic.id;
              return (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      clinic_id: clinic.id,
                      doctor_id: prev.clinic_id === clinic.id ? prev.doctor_id : null,
                    }))
                  }
                  className={cn(
                    'rounded-xl border p-4 text-start transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  <p className="font-semibold">{clinic.name}</p>
                  {clinic.address && (
                    <p className="mt-1 text-sm text-muted-foreground">{clinic.address}</p>
                  )}
                  {clinic.phone && (
                    <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                      {clinic.phone}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          {fieldErrors.clinic && (
            <p className="text-xs text-destructive">{fieldErrors.clinic}</p>
          )}

          {form.clinic_id != null && (
            <div className="space-y-3 pt-2">
              <div>
                <h3 className="font-semibold">{t('select_doctor', 'Select your doctor')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'select_doctor_desc',
                    'Pick the doctor who will care for this patient at the clinic.'
                  )}
                </p>
              </div>
              {doctorsLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('loading_doctors', 'Loading doctors…')}
                </div>
              )}
              {doctorsError && (
                <p className="text-sm text-destructive">
                  {t('err_load_doctors', 'Could not load doctors. Please try again.')}
                </p>
              )}
              {!doctorsLoading && !doctorsError && (doctors?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t(
                    'no_doctors_for_clinic',
                    'No doctors are available for this clinic yet. Choose another clinic or contact support.'
                  )}
                </p>
              )}
              <div className="grid gap-3">
                {(doctors ?? []).map((doctor) => {
                  const selected = form.doctor_id === doctor.id;
                  const name = `${doctor.first_name} ${doctor.last_name}`.trim();
                  return (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, doctor_id: doctor.id }))
                      }
                      className={cn(
                        'rounded-xl border p-4 text-start transition-colors',
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'hover:border-primary/40 hover:bg-muted/40'
                      )}
                    >
                      <p className="font-semibold">{name || doctor.username}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                        @{doctor.username}
                      </p>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.doctor && (
                <p className="text-xs text-destructive">{fieldErrors.doctor}</p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
            <h3 className="font-semibold">{t('app_review_summary', 'Review summary')}</h3>
            {form.includeCaregiver && (
              <p>
                <span className="text-muted-foreground">{t('caregiver')}: </span>
                {form.caregiver.first_name} {form.caregiver.last_name} (@{form.caregiver.username})
              </p>
            )}
            <p>
              <span className="text-muted-foreground">{t('patient', 'Patient')}: </span>
              {form.patientMode === 'ehr'
                ? `${form.patient.ehr_code} · @${form.patient.username}`
                : `${form.patient.first_name} ${form.patient.last_name} (@${form.patient.username})`}
            </p>
            <p>
              <span className="text-muted-foreground">{t('clinic', 'Clinic')}: </span>
              {selectedClinic?.name ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('doctor', 'Doctor')}: </span>
              {selectedDoctor
                ? `${selectedDoctor.first_name} ${selectedDoctor.last_name}`.trim() ||
                  selectedDoctor.username
                : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
          {t('back', 'Back')}
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={goNext}>
            {t('continue', 'Continue')}
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={createApp.isPending}>
            {createApp.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('submitting', 'Submitting…')}
              </>
            ) : (
              t('submit_application', 'Submit application')
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
