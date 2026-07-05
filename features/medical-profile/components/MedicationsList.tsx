import { useState } from "react";
import type { Medication } from "@/features/medical-profile/types/medicalprofile";
import { Pill, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const MedicationsList = ({ medications }: { medications: Medication[] }) => {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<number | null>(
    medications.length === 1 ? medications[0].id : null
  );

  const toggleOpen = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {medications.map((med) => {
        const isOpen = openId === med.id;
        const isActive = !med.end_date || new Date(med.end_date) >= new Date();

        return (
          <div
            key={med.id}
            className={cn(
              "rounded-xl border border-border bg-muted/20 overflow-hidden transition-all duration-300",
              isOpen && "ring-1 ring-primary/20 shadow-sm"
            )}
          >
            <button
              type="button"
              onClick={() => toggleOpen(med.id)}
              className="w-full px-4 py-3.5 flex justify-between items-start gap-3 hover:bg-muted/40 transition-colors text-start"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="rounded-lg bg-blue-500/10 p-2 shrink-0 mt-0.5">
                  <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-sm text-foreground truncate">{med.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isActive ? t("active", "Active") : t("ended", "Ended")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{med.dosage}</span>
                  </div>
                </div>
              </div>

              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 mt-1",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <DetailChip label={t("dosage")} value={med.dosage} />
                  <DetailChip label={t("frequency")} value={med.frequency} />
                  <DetailChip label={t("start_date")} value={formatDate(med.start_date)} />
                  <DetailChip label={t("end_date")} value={formatDate(med.end_date)} />
                </div>

                {med.notes && (
                  <p className="text-xs italic text-muted-foreground border-s-2 border-blue-500/40 ps-2.5 leading-relaxed">
                    {med.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default MedicationsList;
