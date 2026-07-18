import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appointments',
  description: 'Book and manage your appointments',
};

export default async function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col space-y-2">
      <div className="mt-6">{children}</div>
    </div>
  );
}
