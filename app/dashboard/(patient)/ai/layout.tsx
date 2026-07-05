import { AiLayoutShell } from '@/components/chat/ai-layout-shell';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AiLayoutShell>{children}</AiLayoutShell>;
}
