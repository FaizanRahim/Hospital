
'use client';

import { useUserProfile } from '../../../context/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { UpdateProfileForm } from '../../../components/ui/update-profile-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function ProfileContent() {
  const { user, userProfile } = useUserProfile();
  return (
    <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
                Manage your personal details and contact information.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {user && <UpdateProfileForm user={user} userProfile={userProfile} />}
        </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ProfileContent />
        </Suspense>
    )
}
