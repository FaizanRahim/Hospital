'use client';

import { useState } from 'react';
import { useUserProfile } from '../context/user-profile-context';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Bell } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  message: string;
  patientId?: string;
  read?: boolean;
};

export function NotificationsMenu() {
  const { userProfile } = useUserProfile();

  const [notifications] = useState<Notification[]>([]);
  const [unreadCount] = useState(0);

  if (userProfile?.role !== 'doctor') {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive flex items-center justify-center text-xs text-destructive-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80"
        align="end"
        forceMount
      >
        <DropdownMenuLabel>
          Notifications
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            No notifications yet.
          </DropdownMenuItem>
        ) : (
          notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              asChild
              className="cursor-pointer"
            >
              <Link
                href={
                  notif.patientId
                    ? `/dashboard/patient/${notif.patientId}`
                    : '#'
                }
              >
                <div className="flex flex-col">
                  <p
                    className={`text-sm ${
                      !notif.read ? 'font-semibold' : ''
                    }`}
                  >
                    {notif.message}
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}