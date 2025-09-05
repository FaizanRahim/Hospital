'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarToggle } from "../../components/ui/sidebar";
import { useUserProfile } from '../../context/user-profile-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    LifeBuoy,
    Settings,
    User,
    WalletCards,
    CheckCircle,
    BookUser,
    ShieldCheck,
    FileText,
    HeartHandshake,
    UserPlus,
} from 'lucide-react';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import {Skeleton} from "../../components/ui/skeleton";
import { AddPatientDialog } from '../../components/add-patient-dialog';
import {Button} from "../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { ActionCallbackProvider, useActionCallback } from '../../context/action-callback-context';
import {DialogTrigger} from "../../components/ui/dialog";
// -------------------- Sidebar Skeleton --------------------
function SidebarSkeleton() {
    return (
        <div className="p-4">
            <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="mt-auto space-y-4 pt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
}

// -------------------- Doctor Sidebar --------------------
function DoctorSidebar() {
    const pathname = usePathname();
    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard">
                        <SidebarMenuButton icon={<LayoutDashboard />} label="Dashboard" isActive={pathname === '/dashboard'} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/my-patients">
                        <SidebarMenuButton icon={<Users />} label="My Patients" isActive={pathname.startsWith('/dashboard/my-patients')} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/ready-for-review">
                        <SidebarMenuButton icon={<CheckCircle />} label="Ready for Review" isActive={pathname.startsWith('/dashboard/ready-for-review')} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/assessment-orders">
                        <SidebarMenuButton icon={<ClipboardList />} label="Assessment Orders" isActive={pathname.startsWith('/dashboard/assessment-orders')} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/manage-resources">
                        <SidebarMenuButton icon={<BookUser />} label="Manage Resources" isActive={pathname.startsWith('/dashboard/manage-resources')} />
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu className="mt-auto">
                <SidebarMenuItem>
                    <Link href="/dashboard/billing">
                        <SidebarMenuButton icon={<WalletCards />} label="Billing" isActive={pathname === '/dashboard/billing'} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/profile">
                        <SidebarMenuButton icon={<User />} label="Profile" isActive={pathname === '/dashboard/profile'} />
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}

// -------------------- Patient Sidebar --------------------
function PatientSidebar() {
    const pathname = usePathname();
    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard">
                        <SidebarMenuButton icon={<LayoutDashboard />} label="Dashboard" isActive={pathname === '/dashboard'} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/my-doctor">
                        <SidebarMenuButton icon={<HeartHandshake />} label="My Doctor" isActive={pathname === '/dashboard/my-doctor'} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/resources">
                        <SidebarMenuButton icon={<FileText />} label="Resources" />
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu className="mt-auto">
                <SidebarMenuItem>
                    <Link href="/dashboard/profile">
                        <SidebarMenuButton icon={<User />} label="Profile" isActive={pathname === '/dashboard/profile'} />
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}

// -------------------- Admin Sidebar --------------------
function AdminSidebar() {
    const pathname = usePathname();
    const { userProfile } = useUserProfile();

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard">
                        <SidebarMenuButton icon={<LayoutDashboard />} label="Dashboard" isActive={pathname === '/dashboard'} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/admin">
                        <SidebarMenuButton icon={<Users />} label="User Management" isActive={pathname.startsWith('/dashboard/admin')} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/billing">
                        <SidebarMenuButton icon={<WalletCards />} label="Billing" isActive={pathname.startsWith('/dashboard/billing')} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/settings">
                        <SidebarMenuButton icon={<Settings />} label="Platform Settings" isActive={pathname.startsWith('/dashboard/settings')} />
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/audit-log">
                        <SidebarMenuButton icon={<ShieldCheck />} label="Audit Log" isActive={pathname.startsWith('/dashboard/audit-log')} />
                    </Link>
                </SidebarMenuItem>
                {userProfile?.role === 'super_admin' && (
                    <SidebarMenuItem>
                        <Link href="/dashboard/diagnostics">
                            <SidebarMenuButton icon={<LifeBuoy />} label="Diagnostics" isActive={pathname.startsWith('/dashboard/diagnostics')} />
                        </Link>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
            <SidebarMenu className="mt-auto">
                <SidebarMenuItem>
                    <Link href="/dashboard/profile">
                        <SidebarMenuButton icon={<User />} label="Profile" isActive={pathname === '/dashboard/profile'} />
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}

// -------------------- Dynamic Sidebar --------------------
function DynamicSidebar() {
    const { userProfile, loading } = useUserProfile();

    if (loading) return <SidebarSkeleton />;
    if (!userProfile) return null;

    switch (userProfile.role) {
        case 'doctor':
            return <DoctorSidebar />;
        case 'admin':
        case 'super_admin':
            return <AdminSidebar />;
        case 'patient':
        default:
            return <PatientSidebar />;
    }
}

// -------------------- Floating Add Patient Button --------------------
function FloatingAddPatientButton() {
     const { setCallback } = useActionCallback();
      const [refreshCallback, setRefreshCallback] = useState<(() => void) | null>(null);
     useEffect(() => {
        if (refreshCallback) {
          setCallback(() => refreshCallback);
        }
        return () => setCallback(null);
      }, [refreshCallback, setCallback]);
    const { userProfile } = useUserProfile();
    const pathname = usePathname();
    const { callback: onSuccess } = useActionCallback();

    if (userProfile?.role !== 'doctor' || !pathname.startsWith('/dashboard/my-patients')) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
           <AddPatientDialog onSuccess={() => refreshCallback?.()}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <DialogTrigger asChild>
          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            aria-label="Add New Patient"
          >
            <UserPlus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Add New Patient</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</AddPatientDialog>

        </div>
    );
}

// -------------------- Dashboard Client Layout --------------------
export function DashboardClientLayout({
    children,
}: {
    children: React.ReactNode,
}) {
    return (
        <div className="flex flex-1">
            <Sidebar>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <DynamicSidebar />
                </div>
                <SidebarToggle />
            </Sidebar>
            <ActionCallbackProvider>
                <main className="flex-1 p-6 bg-secondary/40 relative">
                    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
                        {children}
                    </Suspense>
                    <FloatingAddPatientButton />
                </main>
            </ActionCallbackProvider>
        </div>
    );
}
