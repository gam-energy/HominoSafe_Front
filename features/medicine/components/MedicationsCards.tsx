import React from "react";
import { Pill } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Medication {
  id: number | string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

interface Props {
  medications: Medication[];
}

const MedicationsCards: React.FC<Props> = ({ medications }) => {
  const { t } = useTranslation();

  if (medications.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("no_medications")}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {medications.map((med) => (
        <CardItem key={med.id} med={med} />
      ))}
    </div>
  );
};

const CardItem = ({ med }: { med: Medication }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-950/30">
          <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-foreground">{med.name}</h3>
      </div>

      {/* Dosage & Frequency */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{t("dosage")}:</span> {med.dosage}
        </p>
        <p>
          <span className="font-semibold text-foreground">{t("frequency")}:</span> {med.frequency}
        </p>
      </div>

      {/* Notes */}
      {med.notes && (
        <p className="mt-2 text-xs italic text-muted-foreground border-s-2 border-blue-500/50 ps-2.5">
          {med.notes}
        </p>
      )}
    </div>
  );
};

export default MedicationsCards;
