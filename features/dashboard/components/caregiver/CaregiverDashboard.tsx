import React, { useState } from 'react';
import { DataTable } from './table/data-table';
import { userColumns } from './table/user-columns';
import { usePatients } from '../../api/caregiver/useGetPatients';
import { LoaderIcon } from "@/components/chat/icons";
import { Button } from '@/components/ui/button';
import axiosInstance from '@/api/axiosInstance';
import { useTranslation } from 'react-i18next';

type FilterOption = "my_patients" | "all_users" | "non_covered";

const CaregiverDashboard = () => {
  const { t } = useTranslation();
  const [filterOption, setFilterOption] = useState<FilterOption>("my_patients");
  const [reportBusyId, setReportBusyId] = useState<number | null>(null);

  const patientsOnly = filterOption === "my_patients";
  const { data: patients, isLoading, error } = usePatients(patientsOnly);

  const downloadWeeklyReport = async (patientId: number) => {
    setReportBusyId(patientId);
    try {
      const res = await axiosInstance.get(`/reports/weekly-family/${patientId}.pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-family-${patientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setReportBusyId(null);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin w-8 h-8 text-blue-500 mb-2 flex items-center justify-center">
        <LoaderIcon size={32} />
      </div>
      <span className="text-muted-foreground">Loading patient list...</span>
    </div>
  );
  if (error) return <p>Error: {error.message}</p>;

  const filteredData =
    filterOption === "non_covered"
      ? (patients ?? []).filter((user) => user.caregiver_id === 0)
      : patients ?? [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Patient List</h1>

      <select
        value={filterOption}
        onChange={(e) => setFilterOption(e.target.value as FilterOption)}
        className="mb-4 rounded border px-3 py-2"
      >
        <option value="my_patients">Show only my patients</option>
        <option value="all_users">Show all users</option>
        <option value="non_covered">Show non-covered users</option>
      </select>

      <div className="rounded-xl border p-4">
        <p className="mb-2 text-sm font-medium">
          {t('weekly_family_reports', 'Weekly family reports')}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          {t(
            'weekly_family_reports_desc',
            'Download a 7-day PDF summary (vitals, critical alerts, medication adherence). WhatsApp delivery comes later.',
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {filteredData.slice(0, 12).map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="outline"
              disabled={reportBusyId === p.id}
              onClick={() => downloadWeeklyReport(p.id)}
            >
              {t('download_pdf', 'PDF')}: {p.first_name || p.username || p.id}
            </Button>
          ))}
        </div>
      </div>

      <DataTable columns={userColumns} data={filteredData} />
    </div>
  );
};

export default CaregiverDashboard;
