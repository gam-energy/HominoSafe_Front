'use client';

export {
  emptyStaticParams as generateStaticParams,
  mobileDynamicParams as dynamicParams,
} from '@/lib/staticExportHelpers';

import DoctorPatientDetail from '@/features/patients-list/components/DoctorPatientDetail';

export default function MyPatientDetailPage() {
  return <DoctorPatientDetail />;
}
