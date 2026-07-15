"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, UserPlus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCreateCaregiverReferral,
  useCreatePatient,
  useReferrals,
} from "../api/useCareTeamOnboarding";
import { useUser } from "@/context/UserContext";

export function InviteCaregiverButton() {
  const { user } = useUser();
  const createReferral = useCreateCaregiverReferral();
  const { data: referrals } = useReferrals();
  const [open, setOpen] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  if (user?.role !== "doctor" && user?.role !== "admin") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Ticket className="h-4 w-4" />
          Invite caregiver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Caregiver referral code</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Share this code so the caregiver can sign up at{" "}
          <code className="text-xs">/auth/sign-up</code>.
        </p>
        <Button
          disabled={createReferral.isPending}
          onClick={async () => {
            const res = await createReferral.mutateAsync({});
            setLastCode(res.code);
          }}
        >
          {createReferral.isPending ? "Generating…" : "Generate new code"}
        </Button>
        {lastCode && (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <code className="flex-1 font-bold tracking-wider">{lastCode}</code>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(lastCode);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {referrals && referrals.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
            {referrals.slice(0, 8).map((r) => (
              <div key={r.id} className="flex justify-between opacity-80">
                <span className="font-mono">{r.code}</span>
                <span>
                  {r.use_count}/{r.max_uses}
                  {r.is_usable ? "" : " (used)"}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AddPatientButton() {
  const createPatient = useCreatePatient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    national_code: "",
    dob: "",
    gender: "Male" as "Male" | "Female",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register patient</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Creates the patient account and links them to you. Monitoring stays
          locked until you complete their health records.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ["first_name", "First name"],
              ["last_name", "Last name"],
              ["username", "Username"],
              ["password", "Password (min 8)"],
              ["email", "Email"],
              ["phone_number", "Phone"],
              ["national_code", "National code"],
              ["dob", "Date of birth"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium">{label}</label>
              <Input
                type={key === "dob" ? "date" : key === "password" ? "password" : "text"}
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium">Gender</label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
        <Button
          disabled={createPatient.isPending}
          onClick={async () => {
            if (
              !form.username ||
              !form.password ||
              !form.first_name ||
              !form.last_name ||
              !form.national_code ||
              !form.dob
            ) {
              toast.error("Fill required fields");
              return;
            }
            await createPatient.mutateAsync({
              ...form,
              email: form.email || undefined,
              phone_number: form.phone_number || undefined,
            });
            setOpen(false);
          }}
        >
          {createPatient.isPending ? "Creating…" : "Create patient"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
