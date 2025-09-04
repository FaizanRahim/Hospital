
'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/context/user-profile-context';
import { useRouter } from 'next/navigation';

function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push('/');
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };
  return (
    <button onClick={handleLogout} className="w-full text-left">
      Logout
    </button>
  );
}

export function AuthButton() {
  const { user, userProfile, loading } = useUserProfile();

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (user && userProfile) {
    const fallbackInitial = userProfile.firstName ? userProfile.firstName.charAt(0) : (user.email?.charAt(0) || '');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{fallbackInitial.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : 'My Account'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/dashboard/profile">Profile</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem><LogoutButton /></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button asChild variant="ghost"><Link href="/login">Login</Link></Button>
      <Button asChild><Link href="/sign-up">Sign Up</Link></Button>
    </div>
  );
}
