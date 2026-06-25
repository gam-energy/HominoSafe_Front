import { useState } from "react";
import type { Medication } from "@/features/medical-profile/types/medicalprofile";
import { Pill, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const MedicationsList = ({ medications }: { medications: Medication[] }) => {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleOpen = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {medications.map((med) => (
        <div
          key={med.id}
          className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          {/* Header */}
          <button
            onClick={() => toggleOpen(med.id)}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground text-sm">{med.name}</span>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-300",
                openId === med.id ? "rotate-180" : "rotate-0"
              )}
            />
          </button>

          {/* Details */}
          {openId === med.id && (
            <div className="px-5 py-4 bg-muted/30 border-t border-border text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow label={t("dosage")} value={med.dosage} />
                <InfoRow label={t("frequency")} value={med.frequency} />
                <InfoRow label={t("start_date")} value={formatDate(med.start_date)} />
                <InfoRow label={t("end_date")} value={formatDate(med.end_date)} />
              </div>

              {med.notes && (
                <p className="mt-2 text-muted-foreground italic border-s-4 border-blue-500/50 ps-3">
                  {med.notes}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Small reusable info row
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <p className="text-muted-foreground">
    <span className="font-semibold text-foreground">{label}: </span>
    {value}
  </p>
);

// Date formatting helper
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

export default MedicationsList;
