
'use client';

import { useUserProfile } from '../../../context/user-profile-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { LinkDoctorForm } from '../../../components/link-doctor-form';
import { Loader2 } from 'lucide-react';
import { getDoctorProfileById } from '../../../lib/actions/user-actions';
import { useEffect, useState, useCallback, Suspense } from 'react';

type DoctorProfile = {
    firstName?: string;
    lastName?: string;
    email?: string;
}

function MyDoctorPageImpl() {
  const { userProfile, loading } = useUserProfile();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);

  const fetchDoctorProfile = useCallback(async () => {
    if (userProfile?.doctorId) {
      const profile = await getDoctorProfileById(userProfile.doctorId);
      setDoctorProfile(profile);
    }
    setDoctorLoading(false);
  }, [userProfile?.doctorId]);

  useEffect(() => {
    if (!loading) {
      fetchDoctorProfile();
    }
  }, [loading, fetchDoctorProfile]);

  if (loading || doctorLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>My Doctor</CardTitle>
        <CardDescription>
          {doctorProfile
            ? "Details about your linked primary care physician."
            : "Link to your doctor to begin receiving and submitting assessments."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {doctorProfile ? (
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">
                {doctorProfile.firstName?.charAt(0) ?? 'D'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{`Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}`}</p>
              <p className="text-muted-foreground">{doctorProfile.email}</p>
            </div>
          </div>
        ) : (
            <LinkDoctorForm />
        )}
      </CardContent>
    </Card>
  );
}

export default function MyDoctorPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MyDoctorPageImpl />
        </Suspense>
    )
}
