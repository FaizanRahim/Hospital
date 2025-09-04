
'use client';

import { useUserProfile } from '@/context/user-profile-context';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const unprotectedRoutes = ['/login', '/sign-up', '/'];

export function ClientSideAuth({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading } = useUserProfile();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (loading) return;

        const isUnprotected = unprotectedRoutes.some(route => pathname === route);
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/sign-up');
        const isSetupPage = pathname === '/dashboard/setup-profile';
        const isKioskPage = pathname.startsWith('/kiosk');

        // Allow access to kiosk pages without auth
        if (isKioskPage) {
            return;
        }

        // If not authenticated and trying to access a protected page
        if (!user && !isUnprotected) {
            const redirectUrl = `/login?redirect=${encodeURIComponent(pathname + searchParams.toString())}`;
            router.push(redirectUrl);
            return;
        }

        if (user) {
            // If authenticated and on an auth page, redirect to dashboard
            if (isAuthPage) {
                const redirectUrl = searchParams.get('redirect') || '/dashboard';
                router.push(redirectUrl);
                return;
            }

            // If profile is incomplete, force setup
            if (userProfile && !userProfile.profileComplete && !isSetupPage) {
                router.push('/dashboard/setup-profile');
                return;
            }
        }
    }, [user, userProfile, loading, router, pathname, searchParams]);

    // Show a loader while the auth state is being determined or a redirect is happening
    if (loading || (!user && !unprotectedRoutes.some(route => pathname === route) && !pathname.startsWith('/kiosk'))) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return <>{children}</>;
}
