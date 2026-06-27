"use client";

import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export function AnalyzeLoadingOverlay() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border bg-card p-6 shadow-lg sm:max-w-md sm:p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-center text-base font-semibold sm:text-lg">
          {t("running_analysis", "Running clinical analysis...")}
        </p>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {t("analysis_may_take", "This may take up to 2 minutes. Please keep this page open.")}
        </p>
      </div>
    </div>
  );
}
