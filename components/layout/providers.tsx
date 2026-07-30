'use client';

import '@/lib/i18n/config';
import { hydrateLanguage } from '@/lib/i18n/config';
import { useTheme } from 'next-themes';
import React, { useEffect } from 'react';
import { ActiveThemeProvider } from '../active-theme';

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  // Resolved theme kept for optional Clerk theming later.
  useTheme();

  useEffect(() => {
    void hydrateLanguage();
  }, []);

  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      {children}
    </ActiveThemeProvider>
  );
}
