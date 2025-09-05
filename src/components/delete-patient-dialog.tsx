
'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { deletePatient, type DeletePatientActionState } from '../lib/actions/user-actions';
import { Button } from '../components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useUserProfile } from '../context/user-profile-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Yes, Delete Patient
        </Button>
    )
}

export function DeletePatientDialog({
  patientId,
  patientName,
  onSuccess,
  children,
}: {
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
  children: ReactNode;
}) {
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const initialState: DeletePatientActionState = { status: 'idle' };
  const [state, formAction] = useFormState(deletePatient, initialState);

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast({ description: state.message });
      onSuccess?.();
      setOpen(false);
    }
    if (state.status === 'error' && state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
      setOpen(false);
    }
  }, [state, toast, onSuccess]);

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the patient{' '}
            <span className="font-bold text-foreground">{patientName}</span> and all of their associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <form action={formAction}>
            <input type="hidden" name="patientId" value={patientId} />
            <input type="hidden" name="actorId" value={user.uid} />
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <SubmitButton />
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
