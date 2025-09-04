
'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserProfile } from '@/context/user-profile-context';
import { linkDoctor, type LinkDoctorActionState } from '@/lib/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Link to Doctor
    </Button>
  );
}

export function LinkDoctorForm() {
    const { user, userProfile, refreshUserProfile } = useUserProfile();
    const { toast } = useToast();
    const [doctorInfo, setDoctorInfo] = useState<DocumentData | null>(null);
  
    const initialState: LinkDoctorActionState = { status: 'idle' };
    const [state, formAction] = useFormState(linkDoctor, initialState);
  
    useEffect(() => {
      if (state.status === 'success' && state.message) {
        toast({ description: state.message });
        refreshUserProfile();
      }
      if (state.status === 'error' && state.error) {
        toast({ variant: 'destructive', title: 'Error', description: state.error });
      }
    }, [state, toast, refreshUserProfile]);
    
    useEffect(() => {
      const fetchDoctorInfo = async () => {
        if (userProfile?.doctorId) {
          const docRef = doc(db, "users", userProfile.doctorId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setDoctorInfo(docSnap.data());
          }
        } else {
            setDoctorInfo(null);
        }
      }
      fetchDoctorInfo();
    }, [userProfile?.doctorId]);

    if (!user || !userProfile) return null;
    
    if (userProfile.doctorId) {
        const doctorName = (doctorInfo?.firstName && doctorInfo?.lastName)
            ? `Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}`
            : doctorInfo?.email || 'your doctor';
        
        return (
            <div>
                <p className="text-sm text-muted-foreground">You are currently sharing your data with {doctorName}.</p>
                 {/* In a real app, an "Unlink" button would go here */}
            </div>
        )
    }

    return (
        <form action={formAction} className="grid gap-4">
            <input type="hidden" name="patientId" value={user.uid} />
            <div className="grid gap-2">
                <Label htmlFor="doctorEmail">Doctor&apos;s Email</Label>
                <Input id="doctorEmail" name="doctorEmail" type="email" placeholder="doctor@example.com" required />
            </div>
            {state.status === 'error' && (
              <p className="text-sm font-medium text-destructive">{state.error}</p>
            )}
            <SubmitButton />
        </form>
    );
}
