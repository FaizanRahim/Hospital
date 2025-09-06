
'use client';

import { PlatformSettingsForm } from '../../../components/platform-settings-form';
import { useUserProfile } from '../../../context/user-profile-context';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

function SettingsPageImpl() {
  const { userProfile, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'super_admin') {
    // This is a client-side redirect for users who might navigate here directly
    redirect('/dashboard');
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Manage branding and integrations for the entire platform.
        </p>
      </div>
      <PlatformSettingsForm />
    </div>
  );
}


export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SettingsPageImpl />
    </Suspense>
  )
}
