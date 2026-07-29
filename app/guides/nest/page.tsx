'use client';

import Link from 'next/link';
import { BookOpen, Camera, Wifi, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';

const STEPS = [
  {
    icon: BookOpen,
    title: 'Unbox Nest',
    body: 'Place Nest on a stable surface with a clear view of the main living area. Keep power and ethernet/Wi‑Fi within reach.',
  },
  {
    icon: Wifi,
    title: 'Power & network',
    body: 'Connect power, then join Nest to your home Wi‑Fi using the pairing sheet in the box (or ethernet if available).',
  },
  {
    icon: Camera,
    title: 'Camera & sensors',
    body: 'Confirm the status light is steady. Fall camera and environment sensors start after the first successful cloud handshake.',
  },
  {
    icon: Shield,
    title: 'Activate in SenioSentry',
    body: 'After delivery you receive an activation code by email. Enter it in the app to unlock monitoring.',
  },
];

export default function NestGuidePage() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-gray-50 p-4 py-10 dark:bg-zinc-950">
      <div className="absolute end-4 top-4 z-20 flex items-center gap-2">
        <ModeToggle />
        <LanguageToggle />
      </div>
      <AuthBrand className="relative z-10 mb-6" />
      <Card className="relative z-10 w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Senio Nest — install & pairing guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Short MVP manual. Full PDF manuals can replace these steps later.
          </p>
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/order">Back to marketplace</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/auth/sign-up">Account setup</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
