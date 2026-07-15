"use client";

import { AlertTriangle, CheckCircle2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import {
  useMarkRecordsComplete,
  usePatientOnboarding,
} from "../api/useCareTeamOnboarding";
import { staffPatientRoutes } from "@/features/patient-knowledge/utils/staffRoutes";
import { useRouter } from "next/navigation";

export function PatientOnboardingBanner({ patientId }: { patientId: number }) {
  const { user } = useUser();
  const router = useRouter();
  const { data, isLoading } = usePatientOnboarding(patientId);
  const unlock = useMarkRecordsComplete(patientId);
  const routes = staffPatientRoutes(user?.role || "doctor", patientId);

  if (isLoading || !data) return null;
  if (data.monitoring_enabled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Monitoring is active for this patient.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <ShieldOff className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Health records incomplete — monitoring locked
          </p>
          <p className="text-sm opacity-90">
            Falls, wearable alerts, and live monitoring stay quiet until the
            doctor completes the patient health record and unlocks monitoring.
          </p>
          {data.missing?.length > 0 && (
            <p className="text-xs opacity-80">
              Missing: {data.missing.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(routes.medicalProfileRoute)}
            >
              Open medical profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(routes.importRoute)}
            >
              Import records
            </Button>
            {(user?.role === "doctor" || user?.role === "admin") && (
              <Button
                size="sm"
                disabled={unlock.isPending}
                onClick={() => unlock.mutate(true)}
              >
                {unlock.isPending ? "Unlocking…" : "Unlock monitoring"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
