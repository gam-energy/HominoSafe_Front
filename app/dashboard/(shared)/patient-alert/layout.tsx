import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patient Alerts',
  description: 'Review clinical alerts for assigned patients',
};

export default function PatientAlertLayout({
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
