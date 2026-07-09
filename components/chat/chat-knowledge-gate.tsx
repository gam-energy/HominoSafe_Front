'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderIcon } from '@/components/chat/icons';
import { useKnowledgeStatus } from '@/features/patient-knowledge/api/useKnowledgeStatus';
import { knowledgeLabel } from '@/features/patient-knowledge/utils/knowledgeLabels';
import { isStaffRole } from '@/features/patient-knowledge/utils/staffRoutes';
import { useUser } from '@/context/UserContext';
import { AlertTriangle } from 'lucide-react';

export function ChatKnowledgeGate({
  userId,
  children,
}: {
  userId: number;
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const skipGate = isStaffRole(user?.role) || user?.role === 'admin';

  const { data: status, isLoading } = useKnowledgeStatus(userId, {
    poll: true,
    enabled: !skipGate,
  });

  if (skipGate) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
          <LoaderIcon size={40} />
        </div>
        <span className="text-lg text-muted-foreground">
          Checking patient knowledge status...
        </span>
      </div>
    );
  }

  if (status?.refresh_status !== 'ready') {
    const statusLabel = knowledgeLabel(status?.refresh_status);

    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6">
        <Alert className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Patient knowledge not ready</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              AI chat works best after your medical records have been indexed.
              Current status:{' '}
              <strong>{statusLabel}</strong>
            </p>
            {status?.summary && (
              <p className="text-sm text-muted-foreground">{status.summary}</p>
            )}
            {status?.refresh_status === 'idle' && (
              <p className="text-sm">
                Your records have not been indexed yet. Ask your care team to
                import and index your medical records.
              </p>
            )}
            {status?.refresh_status === 'failed' && (
              <p className="text-sm">
                Indexing failed. Please contact your care team to re-index your
                records.
              </p>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
