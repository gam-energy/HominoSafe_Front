export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-zinc-950">
      {children}
    </div>
  );
}
