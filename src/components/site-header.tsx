
'use client';

import Link from 'next/link';
import { SiteHeaderContent } from './site-header-content';
import Image from 'next/image';
import { SidebarTrigger } from './ui/sidebar';
import { useUserProfile } from '@/context/user-profile-context';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';

export function SiteHeader({ logoUrl }: { logoUrl: string | null }) {
  const { user } = useUserProfile();
  const pathname = usePathname();

  const isDashboard = pathname.startsWith('/dashboard');
  const showAuthButtons = !user && !pathname.startsWith('/login') && !pathname.startsWith('/sign-up') && !pathname.startsWith('/kiosk');
  const finalLogoUrl = logoUrl || "https://ourwellnesslife.com/wp-content/uploads/2023/06/owl-logo-w.png";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {isDashboard && user && <SidebarTrigger />}
        <Link href="/" className="ml-2 md:ml-4 flex items-center gap-2 font-bold font-headline text-xl">
          <Image src={finalLogoUrl} alt="Platform Logo" width={32} height={32} className="h-8 w-auto" />
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
            {user ? (
                 <SiteHeaderContent />
            ) : showAuthButtons ? (
                <div className="flex items-center space-x-2">
                    <Button asChild variant="ghost"><Link href="/login">Login</Link></Button>
                    <Button asChild><Link href="/sign-up">Sign Up</Link></Button>
                </div>
            ) : null}
        </div>
      </div>
    </header>
  );
}
