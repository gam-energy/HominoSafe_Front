"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import "@/lib/i18n/config";

function applyDirection(lang: string) {
  const isFa = lang.startsWith("fa");
  document.documentElement.dir = isFa ? "rtl" : "ltr";
  document.documentElement.lang = isFa ? "fa" : "en";
}

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyDirection(i18n.language || "en");
  }, [i18n.language]);

  const toggleLanguage = () => {
    const currentLang = i18n.language || "en";
    const newLang = currentLang.startsWith("en") ? "fa" : "en";
    i18n.changeLanguage(newLang);
    applyDirection(newLang);
  };

  if (!mounted) return null;

  const currentLang = i18n.language || "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex min-w-[56px] items-center gap-1.5 font-bold"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      {currentLang.startsWith("en") ? "FA" : "EN"}
    </Button>
  );
}
