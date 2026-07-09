'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useGetRelations } from '../api/use-get-relations';
import { useUnassignPatient } from '../api/use-unassign-patient';
import { AssignCareTeamDialog } from './AssignCareTeamDialog';

const PAGE_SIZE = 50;

export function AdminRelationsTable() {
  const [skip, setSkip] = useState(0);
  const [assign, setAssign] = useState<{
    patientId: number;
    patientName: string;
    role: 'DOCTOR' | 'CAREGIVER';
  } | null>(null);

  const { data, isLoading, error, isFetching } = useGetRelations({
    skip,
    limit: PAGE_SIZE,
  });
  const unassign = useUnassignPatient();

  const relations = data?.relations ?? [];
  const total = data?.total ?? 0;
  const hasMore = skip + relations.length < total;
  const hasPrev = skip > 0;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Care team relations</h1>
          <p className="text-sm text-muted-foreground">
            One row per patient. Shows the assigned doctor and caregiver.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} patient{total === 1 ? '' : 's'} total
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading relations…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              {error.message}
            </div>
          ) : relations.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No patients found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Caregiver</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {relations.map((r) => (
                    <tr
                      key={r.patient_id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/users/${r.patient_id}`}
                          className="font-medium hover:underline"
                        >
                          {r.patient_full_name || r.patient_username}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          @{r.patient_username}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.doctor ? (
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/dashboard/users/${r.doctor.id}`}
                              className="font-medium hover:underline"
                            >
                              {r.doctor.full_name || r.doctor.username}
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-fit px-2 text-xs text-muted-foreground"
                              onClick={() =>
                                unassign.mutate({
                                  patient_id: r.patient_id,
                                  role_assignment: 'DOCTOR',
                                })
                              }
                              disabled={unassign.isPending}
                            >
                              <UserMinus className="h-3 w-3" /> Unassign
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={() =>
                              setAssign({
                                patientId: r.patient_id,
                                patientName:
                                  r.patient_full_name || r.patient_username,
                                role: 'DOCTOR',
                              })
                            }
                          >
                            <UserPlus className="h-3 w-3" /> Assign doctor
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.caregiver ? (
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/dashboard/users/${r.caregiver.id}`}
                              className="font-medium hover:underline"
                            >
                              {r.caregiver.full_name || r.caregiver.username}
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-fit px-2 text-xs text-muted-foreground"
                              onClick={() =>
                                unassign.mutate({
                                  patient_id: r.patient_id,
                                  role_assignment: 'CAREGIVER',
                                })
                              }
                              disabled={unassign.isPending}
                            >
                              <UserMinus className="h-3 w-3" /> Unassign
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={() =>
                              setAssign({
                                patientId: r.patient_id,
                                patientName:
                                  r.patient_full_name || r.patient_username,
                                role: 'CAREGIVER',
                              })
                            }
                          >
                            <UserPlus className="h-3 w-3" /> Assign caregiver
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/users/${r.patient_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open patient →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(hasPrev || hasMore) && (
            <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrev || isFetching}
                onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                {skip + 1}–{skip + relations.length} of {total}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || isFetching}
                onClick={() => setSkip(skip + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {assign && (
        <AssignCareTeamDialog
          patientId={assign.patientId}
          patientName={assign.patientName}
          role={assign.role}
          open={!!assign}
          onOpenChange={(o) => !o && setAssign(null)}
        />
      )}
    </div>
  );
}
