
'use client';
import { useUserProfile } from '@/context/user-profile-context';
import { UpdateProfileForm } from '@/components/ui/update-profile-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function SetupProfileContent() {
    const { user, userProfile } = useUserProfile();
    return (
         <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Complete Your Profile</CardTitle>
                    <CardDescription>
                        Please provide some additional details to finish setting up your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {user && <UpdateProfileForm user={user} userProfile={userProfile} />}
                </CardContent>
            </Card>
        </div>
    )
}


export default function SetupProfilePage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <SetupProfileContent />
      </Suspense>
    )
}
