'use client';

import { MatrixAvatar } from '@/components/matrix-avatar';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    id: number;
    role: 'admin' | 'patient' | 'caregiver' | 'doctor';
    status: 'active' | 'inactive';
  } | null;
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user
}: UserAvatarProfileProps) {
  const fullName = user ? `${user.first_name} ${user.last_name}` : '';

  return (
    <div className="flex items-center gap-2">
      <MatrixAvatar
        username={user?.username}
        firstName={user?.first_name}
        lastName={user?.last_name}
        className={className}
        fallbackClassName="rounded-lg"
        alt={fullName || 'User'}
      />

      {showInfo && user && (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{fullName}</span>
          <span className="truncate text-xs">{user.email}</span>
        </div>
      )}
    </div>
  );
}
