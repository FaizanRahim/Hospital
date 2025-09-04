
'use client';

import { Suspense } from 'react';
import { useUserProfile } from '@/context/user-profile-context';
import { DoctorDashboard } from '@/components/doctor-dashboard';
import { PatientAssessmentView } from '@/components/patient-assessment-view';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
  const { user, userProfile, loading } = useUserProfile();

  if (loading || !user || !userProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile.profileComplete && userProfile.role === 'patient') {
      // The client side auth should already be redirecting, but this is a fallback.
      return null;
  }
  
  if (userProfile.role === 'doctor') {
    return <DoctorDashboard />;
  }

  if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
    return <AdminDashboard />;
  }
  
  // Default to patient view
  return <PatientAssessmentView user={user} userProfile={userProfile} />;
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
 ,   )
}
