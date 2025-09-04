
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateUserProfile, type UpdateProfileActionState } from '@/lib/actions/user-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase-admin/firestore';
import { Loader2 } from 'lucide-react';
import { DatePicker } from './date-picker';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Update Profile
    </Button>
  );
}

// Helper function to safely convert a Firestore Timestamp or string to a Date object
function safeToDate(timestamp: any): Date | null {
    if (!timestamp) return null;
    // Handle Firestore Timestamp
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    // Handle ISO string from server actions
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return null;
}

export function UpdateProfileForm({ user, userProfile }: { user: User, userProfile: DocumentData | null }) {
  const initialState: UpdateProfileActionState = { status: 'idle' };
  const [state, formAction] = useFormState(updateUserProfile, initialState);

  useEffect(() => {
    if (state.status === 'success') {
      toast({ title: 'Success', description: state.message });
    } else if (state.status === 'error') {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state]);
  
  const defaultDob = userProfile?.dateOfBirth ? safeToDate(userProfile.dateOfBirth) : null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={user.uid} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" defaultValue={userProfile?.firstName || ''} required />
          </div>
          <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" defaultValue={userProfile?.lastName || ''} required />
          </div>
      </div>
       <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <DatePicker name="dateOfBirth" defaultDate={defaultDob} />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" defaultValue={userProfile?.phone || ''} required />
      </div>
      <div>
        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
        <Input id="emergencyContactName" name="emergencyContactName" defaultValue={userProfile?.emergencyContactName || ''} required />
      </div>
       <div>
        <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
        <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={userProfile?.emergencyContactPhone || ''} required />
      </div>
      <div className="flex items-center space-x-2">
            <Checkbox id="hipaaConsent" name="hipaaConsent" required defaultChecked={userProfile?.hipaaConsent} />
            <Label htmlFor="hipaaConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I acknowledge and consent to the HIPAA privacy policy.
            </Label>
      </div>
      <SubmitButton />
    </form>
  );
}
