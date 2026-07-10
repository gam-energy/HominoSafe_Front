'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  KeyRound,
  RotateCcw,
  Trash2,
  RefreshCw,
  Users,
  MessageSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoaderIcon } from '@/components/chat/icons';

import { useGetAdminUser } from '../api/use-get-admin-user';
import { useGetUserRooms } from '../api/use-get-user-rooms';
import { useDeleteAdminUser } from '../api/use-delete-admin-user';
import { useReactivateUser } from '../api/use-reactivate-user';
import { useUnassignPatient } from '../api/use-unassign-patient';
import {
  isInactive,
  isRole,
  isSynapseFailed,
  roleBadgeClass,
  roleLabel,
  statusBadgeClass,
  statusLabel,
  synapseBadgeClass,
  synapseLabel,
} from '../utils/normalizeEnum';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { SynapseRetryDialog } from './SynapseRetryDialog';
import { AssignCareTeamDialog } from './AssignCareTeamDialog';

interface AdminUserDetailProps {
  userId: number | string;
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-0">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm break-words">
        {value === null || value === undefined || value === '' ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

export function AdminUserDetail({ userId }: AdminUserDetailProps) {
  const router = useRouter();
  const { data: user, isLoading, error } = useGetAdminUser(userId);
  const { data: userRooms } = useGetUserRooms(userId);

  const deleteUser = useDeleteAdminUser();
  const reactivate = useReactivateUser();
  const unassign = useUnassignPatient();

  const [resetOpen, setResetOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [assignRole, setAssignRole] = useState<'DOCTOR' | 'CAREGIVER' | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 text-blue-500 mb-3 flex items-center justify-center">
          <LoaderIcon size={32} />
        </div>
        <span className="text-muted-foreground">Loading user…</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-muted-foreground">
          {error ? error.message : 'User not found.'}
        </span>
        <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
          Back to users
        </Button>
      </div>
    );
  }

  const isAdmin = isRole(user.role, 'ADMIN');
  const isPatient = isRole(user.role, 'PATIENT');
  const inactive = isInactive(user.status);
  const synapseFailed = isSynapseFailed(user.synapse_status);

  const fullName =
    `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username;

  const handleUnassign = (which: 'DOCTOR' | 'CAREGIVER') => {
    unassign.mutate({ patient_id: Number(userId), role_assignment: which });
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/users')}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{fullName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={roleBadgeClass(user.role)}>{roleLabel(user.role)}</Badge>
          <Badge className={statusBadgeClass(user.status)}>
            {statusLabel(user.status)}
          </Badge>
          <Badge className={synapseBadgeClass(user.synapse_status)}>
            Synapse: {synapseLabel(user.synapse_status)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetOpen(true)}
          disabled={isAdmin}
        >
          <KeyRound className="h-4 w-4" /> Reset password
        </Button>
        {inactive ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => reactivate.mutate(userId)}
            disabled={reactivate.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
          </Button>
        ) : null}
        {synapseFailed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryOpen(true)}
          >
            <RefreshCw className="h-4 w-4" /> Retry Synapse
          </Button>
        ) : null}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={isAdmin}
          title={isAdmin ? 'Admin users cannot be deleted' : undefined}
        >
          <Trash2 className="h-4 w-4" /> Deactivate
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isPatient && <TabsTrigger value="care-team">Care Team</TabsTrigger>}
          <TabsTrigger value="chatrooms">Chatrooms</TabsTrigger>
          <TabsTrigger value="chat-sessions">Chat Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              <FieldRow label="ID" value={user.id} />
              <FieldRow label="Username" value={user.username} />
              <FieldRow label="Email" value={user.email} />
              <FieldRow label="Phone" value={user.phone_number} />
              <FieldRow label="First name" value={user.first_name} />
              <FieldRow label="Last name" value={user.last_name} />
              <FieldRow label="Date of birth" value={user.dob} />
              <FieldRow label="Gender" value={user.gender} />
              <FieldRow label="National code" value={user.national_code} />
              <FieldRow label="Weight" value={user.weight != null ? `${user.weight} kg` : null} />
              <FieldRow label="Height" value={user.height != null ? `${user.height} cm` : null} />
              <FieldRow
                label="Specialization"
                value={user.specialization}
              />
              <FieldRow
                label="Relationship to patient"
                value={user.relationship_to_patient}
              />
              <FieldRow label="Synapse ID" value={user.synapse_id} />
              <FieldRow label="Created at" value={user.created_at} />
              <FieldRow label="Updated at" value={user.updated_at} />
            </CardContent>
          </Card>
        </TabsContent>

        {isPatient && (
          <TabsContent value="care-team">
            <Card>
              <CardHeader>
                <CardTitle>Care team</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CareTeamCard
                    title="Doctor"
                    member={
                      user.doctor_id
                        ? { id: user.doctor_id }
                        : null
                    }
                    onAssign={() => setAssignRole('DOCTOR')}
                    onUnassign={() => handleUnassign('DOCTOR')}
                    busy={unassign.isPending}
                  />
                  <CareTeamCard
                    title="Caregiver"
                    member={
                      user.caregiver_id
                        ? { id: user.caregiver_id }
                        : null
                    }
                    onAssign={() => setAssignRole('CAREGIVER')}
                    onUnassign={() => handleUnassign('CAREGIVER')}
                    busy={unassign.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only active doctors and caregivers can be assigned. Use the
                  Relations screen for a full overview.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="chatrooms">
          <Card>
            <CardHeader>
              <CardTitle>Matrix chatrooms</CardTitle>
            </CardHeader>
            <CardContent>
              {userRooms?.rooms?.length ? (
                <ul className="flex flex-col gap-2">
                  {userRooms.rooms.map((roomId) => (
                    <li
                      key={roomId}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                    >
                      <code className="text-xs">{roomId}</code>
                      <Link
                        href="/dashboard/chatrooms"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Manage →
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  MXID: <code>{userRooms?.mxid ?? '—'}</code>
                  <br />
                  This user has not joined any rooms.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat-sessions">
          <Card>
            <CardHeader>
              <CardTitle>AI chat sessions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Open the audit screen filtered to this user.
              </p>
              <Link
                href={`/dashboard/chat-sessions?user_id=${user.id}`}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4" />
                View chat sessions for {fullName}
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResetPasswordDialog
        userId={userId}
        username={user.username}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
      <SynapseRetryDialog
        userId={userId}
        username={user.username}
        open={retryOpen}
        onOpenChange={setRetryOpen}
      />
      {assignRole && (
        <AssignCareTeamDialog
          patientId={Number(userId)}
          patientName={fullName}
          role={assignRole}
          open={!!assignRole}
          onOpenChange={(o) => !o && setAssignRole(null)}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the user (status → INACTIVE). Their data is
              preserved and the user can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmDelete(false);
                deleteUser.mutate(userId, {
                  onSuccess: () => router.push('/dashboard/users'),
                });
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CareTeamCard({
  title,
  member,
  onAssign,
  onUnassign,
  busy,
}: {
  title: string;
  member: { id: number } | null;
  onAssign: () => void;
  onUnassign: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{title}</span>
      </div>
      {member ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">User ID #{member.id}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onUnassign}
            disabled={busy}
          >
            Unassign
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Unassigned</span>
          <Button variant="outline" size="sm" onClick={onAssign}>
            Assign
          </Button>
        </div>
      )}
    </div>
  );
}
