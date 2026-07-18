import axiosInstance from '@/api/axiosInstance';
import { useQuery, useMutation } from '@tanstack/react-query';

export type EhrStandard = 'europe' | 'canada';

export interface EhrExportResponse {
  patient_id: number;
  standard: EhrStandard;
  generated_at: string;
  bundle: Record<string, unknown>;
}

export interface ClinicEhrStandard {
  clinic_id: number;
  clinic_name: string;
  ehr_standard: EhrStandard;
}

export function useExportEhr() {
  return useMutation({
    mutationFn: async ({
      patientId,
      standard,
      format,
    }: {
      patientId: number;
      standard?: EhrStandard;
      format: 'json' | 'pdf';
    }) => {
      if (format === 'pdf') {
        const response = await axiosInstance.get(`/ehr/${patientId}`, {
          params: { standard, format: 'pdf' },
          responseType: 'blob',
        });
        return {
          blob: response.data as Blob,
          filename: `ehr-patient-${patientId}-${standard ?? 'auto'}.pdf`,
        };
      }
      const { data } = await axiosInstance.get<EhrExportResponse>(`/ehr/${patientId}`, {
        params: { standard, format: 'json' },
      });
      return { json: data };
    },
  });
}

export function useMyClinicEhrStandard() {
  return useQuery({
    queryKey: ['my-clinic-ehr-standard'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ClinicEhrStandard>('/me/clinic');
      return data;
    },
  });
}

export function useUpdateMyClinicEhrStandard() {
  return useMutation({
    mutationFn: async (standard: EhrStandard) => {
      // The backend expects a query parameter (not JSON body).
      const { data } = await axiosInstance.patch<ClinicEhrStandard>(
        '/me/clinic/ehr-standard',
        null,
        {
          params: { ehr_standard: standard },
          headers: { 'Content-Type': 'application/json' },
        },
      );
      return data;
    },
  });
}

/** Triggers a browser download for a Blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
