
'use client';

import { AuthButton } from './auth-components';
import { NotificationsMenu } from './notifications-menu';
import { useMemo } from 'react';
import { useUserProfile } from '../context/user-profile-context';

export function SiteHeaderContent() {
  const { user } = useUserProfile();
  
  const content = useMemo(() => {
    if (!user) return null;

    return (
      <>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <NotificationsMenu />
            <AuthButton />
          </nav>
        </div>
      </>
    );
  }, [user]);

  return (
    <div className="flex flex-1 items-center justify-between">
        {content}
    </div>
  );
}
