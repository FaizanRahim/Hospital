
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Send, Clock, Eye, Mail, Trash2, Loader2 } from 'lucide-react';
import { sendAssessmentToPatient, resendInviteToPatient, type SendAssessmentActionState } from '@/lib/actions/user-actions';
import { useToast } from '@/hooks/use-toast';
import { DeletePatientDialog } from './delete-patient-dialog';
import { useUserProfile } from '@/context/user-profile-context';

function SendAssessmentFormItem({ patient, onSent }: { patient: any; onSent: () => void }) {
  const { toast } = useToast();
  const { user } = useUserProfile();
  const initialState: SendAssessmentActionState = { status: 'idle' };
  const [state, formAction] = useFormState(sendAssessmentToPatient, initialState);

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast({ description: state.message });
      onSent();
    } else if (state.status === 'error' && state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, onSent]);

  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="patientId" value={patient.id} />
      <input type="hidden" name="patientEmail" value={patient.email} />
      <input type="hidden" name="doctorId" value={user?.uid || ''} />
      <button
        type="submit"
        disabled={pending}
        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Send Assessment
      </button>
    </form>
  );
}

function ResendInviteFormItem({ patient, onSent }: { patient: any; onSent: () => void }) {
    const { toast } = useToast();
    const { user } = useUserProfile();
    const initialState: SendAssessmentActionState = { status: 'idle' };
    const [state, formAction] = useFormState(resendInviteToPatient, initialState);

    useEffect(() => {
        if (state.status === 'success' && state.message) {
            toast({ description: state.message });
            onSent();
        } else if (state.status === 'error' && state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onSent]);

    const { pending } = useFormStatus();

    return (
        <form action={formAction} className="w-full">
            <input type="hidden" name="patientId" value={patient.id} />
            <input type="hidden" name="patientEmail" value={patient.email} />
            <input type="hidden" name="doctorId" value={user?.uid || ''} />
            <button
                type="submit"
                disabled={pending}
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Resend Invite
            </button>
        </form>
    );
}

export function PatientActionsDropdown({ patient, onActionSuccess }: { patient: any; onActionSuccess: () => void }) {
    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {patient.assessmentStatus === 'pending' ? (
                    <DropdownMenuItem disabled>
                        <Clock className="mr-2 h-4 w-4" />
                        Pending
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem asChild>
                      <SendAssessmentFormItem patient={patient} onSent={onActionSuccess} />
                    </DropdownMenuItem>
                )}
                 <DropdownMenuItem asChild>
                    <ResendInviteFormItem patient={patient} onSent={onActionSuccess} />
                 </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/dashboard/patient/${patient.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View History
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeletePatientDialog patientId={patient.id} patientName={patientName} onSuccess={onActionSuccess}>
                    <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Patient
                    </button>
                </DeletePatientDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
