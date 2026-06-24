"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import "@/lib/i18n/config";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize direction on mount
    const savedLang = i18n.language || "en";
    document.documentElement.dir = savedLang.startsWith("fa") ? "rtl" : "ltr";
    document.documentElement.lang = savedLang;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const currentLang = i18n.language || "en";
    const newLang = currentLang.startsWith("en") ? "fa" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  if (!mounted) return null;

  const currentLang = i18n.language || "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="font-bold min-w-[40px]"
    >
      {currentLang.startsWith("en") ? "FA" : "EN"}
    </Button>
  );
}
