"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { hydrateLanguage, normalizeLng, persistLng } from "@/lib/i18n/config";
import "@/lib/i18n/config";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void hydrateLanguage().finally(() => setMounted(true));
  }, []);

  const toggleLanguage = () => {
    const currentLang = normalizeLng(i18n.language);
    const newLang = currentLang === "en" ? "fa" : "en";
    persistLng(newLang);
    void i18n.changeLanguage(newLang);
  };

  if (!mounted) return null;

  const currentLang = normalizeLng(i18n.language);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex min-w-[56px] items-center gap-1.5 font-bold"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      {currentLang === "en" ? "FA" : "EN"}
    </Button>
  );
}
