
'use client';

import { Suspense } from 'react';
import { UserManagement } from '@/components/user-management';
import { Loader2 } from 'lucide-react';

function AdminPageImpl() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage user roles and access across the platform.
        </p>
      </div>
      <UserManagement />
    </div>
  );
}


export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AdminPageImpl />
    </Suspense>
  )
}
