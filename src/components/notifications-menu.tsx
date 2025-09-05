
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { type Notification } from '../lib/firebase/firestore-types';


export function NotificationsMenu() {
  const { user, userProfile } = useUserProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || userProfile?.role !== 'doctor') return;

    const q = query(
      collection(db, 'notifications'),
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  const handleOpenChange = async (open: boolean) => {
    if (open && unreadCount > 0) {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notif of unreadNotifications) {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      }
    }
  };
  
  if (userProfile?.role !== 'doctor') {
    return null;
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive flex items-center justify-center text-xs text-destructive-foreground">
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications yet.</DropdownMenuItem>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem key={notif.id} asChild className="cursor-pointer">
              <Link href={`/dashboard/patient/${notif.patientId}`}>
                <div className="flex flex-col">
                  <p className={`text-sm ${!notif.read ? 'font-semibold' : ''}`}>{notif.message}</p>
                  {notif.createdAt?.seconds && (
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
