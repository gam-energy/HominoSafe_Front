'use client';

import { useUser } from '@/context/UserContext';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatrixAvatar } from '@/components/matrix-avatar';
import {
  Edit,
  Phone,
  Mail,
  Sparkles,
  Scale,
  Ruler,
  CalendarDays,
  MessageCircle,
  Watch,
  Stethoscope,
  HeartHandshake,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCreateRoom } from '@/features/chat/api/use-craete-room';
import { useProfileStats } from '@/features/profile/hook/useGetUser';
import { PairWatchDialog } from './PairWatchDialog';
import { CopyButton } from '@/components/ui/copy-button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

type CareTeamMember = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialization?: string | null;
  relationship_to_patient?: string | null;
  email?: string | null;
  phone_number?: string | null;
};

type ClinicInfo = {
  id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
};

type ViewedUser = {
  id: number;
  uuid?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  status?: string;
  doctor?: CareTeamMember | null;
  caregiver?: CareTeamMember | null;
  clinic?: ClinicInfo | null;
  doctor_id?: number | null;
  caregiver_id?: number | null;
  clinic_id?: number | null;
};

interface ProfileCardProps {
  /**
   * Optional user object to display. When omitted, the card shows the
   * currently logged-in user (used on the patient's own dashboard).
   * When provided (e.g. a doctor viewing a patient), the card shows
   * that user's info and exposes a "Message patient" action.
   */
  viewedUser?: ViewedUser;
}

function formatStat(value: number | null | undefined, unit: string): string {
  if (value == null || value <= 0) return '—';
  return `${value}${unit ? '' : ''}`;
}

function memberName(m?: CareTeamMember | null) {
  if (!m) return null;
  const full = `${m.first_name || ''} ${m.last_name || ''}`.trim();
  return full || m.username || null;
}

export default function ProfileCard({ viewedUser }: ProfileCardProps = {}) {
  const { t } = useTranslation();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const createRoomMutation = useCreateRoom();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [watchDialogOpen, setWatchDialogOpen] = useState(false);

  const user = viewedUser ?? currentUser;
  const isViewingOther = !!viewedUser && currentUser?.id !== viewedUser.id;

  const { data: profileStats, isLoading: statsLoading } = useProfileStats(
    isViewingOther ? viewedUser?.id : undefined
  );

  // When staff pass a thin viewedUser, refresh care-team details from /user/{id}.
  const { data: careTeamUser } = useQuery({
    queryKey: ['user-care-team', viewedUser?.id ?? currentUser?.id ?? 'self'],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      if (isViewingOther && viewedUser?.id) {
        const { data } = await axiosInstance.get<ViewedUser>(
          `/user/${viewedUser.id}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        return data;
      }
      const { data } = await axiosInstance.get<ViewedUser>('/user/', {
        headers: { 'Content-Type': 'application/json' },
      });
      return data;
    },
  });

  const doctor = careTeamUser?.doctor ?? viewedUser?.doctor ?? null;
  const caregiver = careTeamUser?.caregiver ?? viewedUser?.caregiver ?? null;
  const clinic = careTeamUser?.clinic ?? viewedUser?.clinic ?? null;

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-sm border p-8 backdrop-blur-md">
        No user data available.
      </div>
    );
  }

  const isOnline = user.status === 'active';

  const handleMessagePatient = async () => {
    if (!viewedUser) return;
    setIsCreatingRoom(true);
    try {
      const response = await createRoomMutation.mutateAsync({
        target_username: viewedUser.username,
        room_name: viewedUser.username,
        topic: 'General_discussion',
      });
      if (response?.room_id) {
        router.push(`/dashboard/chat/${response.room_id}`);
      }
    } catch (error) {
      console.error('Failed to start chat with patient:', error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const statItems = [
    {
      label: t('weight', 'Weight'),
      value: statsLoading ? '…' : formatStat(profileStats?.weight, ' kg'),
      unit: profileStats?.weight ? 'kg' : '',
      icon: Scale,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: t('height', 'Height'),
      value: statsLoading ? '…' : formatStat(profileStats?.height, ' cm'),
      unit: profileStats?.height ? 'cm' : '',
      icon: Ruler,
      color: 'text-violet-500 bg-violet-500/10',
    },
    {
      label: t('age', 'Age'),
      value: statsLoading ? '…' : formatStat(profileStats?.age, ' yrs'),
      unit: profileStats?.age ? 'yrs' : '',
      icon: CalendarDays,
      color: 'text-amber-500 bg-amber-500/10',
    },
  ];

  const careRows = [
    {
      key: 'doctor',
      label: t('doctor', 'Doctor'),
      icon: Stethoscope,
      name: memberName(doctor),
      detail: doctor?.specialization || null,
      empty: t('no_doctor_assigned', 'No doctor assigned'),
    },
    {
      key: 'caregiver',
      label: t('caregiver', 'Caregiver'),
      icon: HeartHandshake,
      name: memberName(caregiver),
      detail: caregiver?.relationship_to_patient || null,
      empty: t('no_caregiver_assigned', 'No caregiver assigned'),
    },
    {
      key: 'clinic',
      label: t('clinic', 'Clinic'),
      icon: Building2,
      name: clinic?.name || null,
      detail: clinic?.code ? `${clinic.code}` : clinic?.address || null,
      empty: t('no_clinic_assigned', 'No clinic assigned'),
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden flex h-full flex-col gap-6 rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md group"
      >
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10 dark:from-blue-500/10 dark:via-blue-500/5" />

        <div className="flex flex-col items-center text-center gap-4 pt-4">
          <div className="relative">
            <MatrixAvatar
              username={user.username}
              firstName={user.first_name}
              lastName={user.last_name}
              className="h-24 w-24 ring-4 ring-primary/20 shadow-md group-hover:ring-primary/40 transition-all duration-300"
              fallbackClassName="text-2xl font-black bg-gradient-to-br from-primary to-primary-hover text-white"
            />

            <span className="absolute bottom-1 right-1 flex h-4.5 w-4.5 rounded-full border-2 border-white dark:border-zinc-900 bg-background items-center justify-center">
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2.5 w-2.5',
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              >
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
              </span>
            </span>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent flex items-center justify-center gap-1.5">
              {user.first_name} {user.last_name}
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </CardTitle>
            <p className="text-xs font-semibold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block">
              {t('patient_role', 'Patient')} • @{user.username}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-sm text-muted-foreground p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-300">
            <Phone className="w-4 h-4 text-primary" />
            <span className="ltr-nums font-semibold">{user.phone_number || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-300">
            <Mail className="w-4 h-4 text-primary" />
            <span className="truncate font-semibold">{user.email || 'No email provided'}</span>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-zinc-200/70 bg-muted/20 p-3 dark:border-zinc-800/70">
          <p className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground px-1">
            {t('care_team', 'Care team')}
          </p>
          {careRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.key}
                className="flex items-start gap-3 rounded-xl bg-background/70 px-2.5 py-2"
              >
                <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.name || row.empty}
                  </p>
                  {row.name && row.detail ? (
                    <p className="truncate text-xs text-muted-foreground">{row.detail}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {statItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.label}
                className="bg-muted/40 dark:bg-zinc-800/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-zinc-800/60 shadow-sm hover:shadow transition-all duration-300"
              >
                <div className={cn('p-1.5 rounded-xl', item.color)}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                    {item.label}
                  </span>
                  <div className="font-bold text-sm ltr-nums text-gray-800 dark:text-zinc-200">
                    {item.value === '—' ? (
                      '—'
                    ) : (
                      <>
                        {item.value.replace(item.unit, '').trim()}
                        {item.unit && (
                          <span className="text-[10px] ms-0.5 font-normal text-muted-foreground">
                            {item.unit}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-4 space-y-2">
          {user.uuid && (
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-muted/30 dark:bg-zinc-800/20 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                  {t('patient_uuid', 'Patient UUID')}
                </span>
                <CopyButton
                  content={String(user.uuid)}
                  copyMessage={t('copied', 'Copied to clipboard')}
                />
              </div>
              <div className="break-all font-mono text-xs font-bold text-gray-800 dark:text-zinc-200">
                {user.uuid}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {t(
                  'patient_uuid_pi_hint',
                  'Paste this as mqtt.patient_id in senio_pi/config.yaml when linking a Raspberry Pi camera.'
                )}
              </p>
            </div>
          )}
          {isViewingOther ? (
            <Button
              onClick={handleMessagePatient}
              disabled={isCreatingRoom}
              className="w-full rounded-2xl h-11 hover:bg-primary hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border-zinc-200 dark:border-zinc-800 hover:border-transparent transition-all duration-300 group"
            >
              <MessageCircle className="w-4 h-4 me-2 group-hover:rotate-12 transition-transform duration-300" />
              {isCreatingRoom
                ? t('starting_chat', 'Starting chat...')
                : t('message_patient', 'Message Patient')}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                className="w-full rounded-2xl h-11"
                onClick={() => setWatchDialogOpen(true)}
              >
                <Watch className="w-4 h-4 me-2" />
                {t('connect_smartwatch', 'Connect Smart Watch')}
              </Button>
              <Link href="/dashboard/profile" className="w-full block">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-11 hover:bg-primary hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border-zinc-200 dark:border-zinc-800 hover:border-transparent transition-all duration-300 group"
                >
                  <Edit className="w-4 h-4 me-2 group-hover:rotate-12 transition-transform duration-300" />
                  {t('edit_profile', 'Edit Profile')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {!isViewingOther && (
        <PairWatchDialog open={watchDialogOpen} onOpenChange={setWatchDialogOpen} />
      )}
    </>
  );
}
