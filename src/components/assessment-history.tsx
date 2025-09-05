
'use client';

import React, { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Pencil, NotebookPen, Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '../components/ui/dialog';
import { Button } from './ui/button';
import { addOrUpdateDoctorNote, emailAssessmentResults } from '../lib/actions';
import { Textarea } from './ui/textarea';
import { AssessmentDetails } from './assessment-details';
import { useToast } from '../hooks/use-toast';
import { ScrollArea } from '../components/ui/scroll-area';
import { type Assessment } from '../lib/firebase/firestore-types';


function getSeverity(score: number, type: 'phq9' | 'gad7'): string {
    if (type === 'phq9') {
        if (score <= 4) return 'Minimal';
        if (score <= 9) return 'Mild';
        if (score <= 14) return 'Moderate';
        if (score <= 19) return 'Moderately Severe';
        return 'Severe';
    }
    // GAD-7
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
}

function NoteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Note
    </Button>
  );
}

export function AddNoteDialog({
  assessmentId,
  currentNote,
  onNoteAdded
}: {
  assessmentId: string;
  currentNote?: string;
  onNoteAdded: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useFormState(addOrUpdateDoctorNote, {
    status: 'idle',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === 'success') {
      toast({ description: "Note saved successfully."})
      onNoteAdded();
      setOpen(false);
    }
     if (state.status === 'error') {
      toast({ variant: "destructive", description: state.error })
    }
  }, [state, onNoteAdded, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          {currentNote ? (
            <Pencil className="mr-2 h-4 w-4" />
          ) : (
            <NotebookPen className="mr-2 h-4 w-4" />
          )}
          {currentNote ? 'Edit Note' : 'Add Note'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentNote ? 'Edit' : 'Add'} Doctor&apos;s Note</DialogTitle>
          <DialogDescription>
            Add or update your clinical notes for this assessment. This will mark it as "reviewed".
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="assessmentId" value={assessmentId} />
          <div className="grid gap-4 py-4">
            <Textarea
              id="note"
              name="note"
              defaultValue={currentNote || ''}
              className="min-h-[150px]"
              placeholder="Type your notes here..."
            />
          </div>
          {state.status === 'error' && (
            <p className="text-sm text-destructive mb-4">{state.error}</p>
          )}
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
            </DialogClose>
            <NoteSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmailResultsButton({ assessmentId }: { assessmentId: string }) {
    const { toast } = useToast();
    const [state, formAction] = useFormState(emailAssessmentResults, { status: 'idle' });

    useEffect(() => {
        if (state.status === 'success') {
            toast({ description: 'A copy of your results has been sent to your email.' });
        } else if (state.status === 'error') {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

    const { pending } = useFormStatus();

    return (
        <form action={formAction}>
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <Button type="submit" variant="outline" size="sm" className="h-8" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Email Results
            </Button>
        </form>
    );
}

export function AssessmentHistory({
  userId,
  viewerRole,
  assessments,
  onAssessmentChange,
}: {
  userId: string;
  viewerRole: 'patient' | 'doctor';
  assessments: Assessment[];
  onAssessmentChange: () => void;
}) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment History</CardTitle>
        <CardDescription>A log of all completed assessments.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>PHQ-9</TableHead>
                <TableHead>GAD-7</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assessments.length > 0 ? (
                assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                    <TableCell className="whitespace-nowrap">
                        {format(new Date(assessment.createdAt.seconds * 1000), 'PPP')}
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary">{assessment.phq9Score} - {getSeverity(assessment.phq9Score, 'phq9')}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary">{assessment.gad7Score} - {getSeverity(assessment.gad7Score, 'gad7')}</Badge>
                    </TableCell>
                    <TableCell>
                         {assessment.recommendationGenerated === false ? (
                           <Badge variant="destructive">Review Needed</Badge>
                         ) : (
                           <Badge variant="success">Reviewed</Badge>
                         )}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">View Details</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                <DialogHeader>
                                <DialogTitle>Assessment Details: {format(new Date(assessment.createdAt.seconds * 1000), 'PPP')}</DialogTitle>
                                <DialogDescription>
                                    A detailed view of the patient&apos;s assessment responses and scores.
                                </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="flex-1">
                                <div className="pr-6">
                                    <AssessmentDetails assessment={assessment} viewerRole={viewerRole} onNoteAdded={onAssessmentChange} />
                                </div>
                                </ScrollArea>
                            </DialogContent>
                            </Dialog>
                            {viewerRole === 'patient' && (
                                <EmailResultsButton assessmentId={assessment.id} />
                            )}
                        </div>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={viewerRole === 'doctor' ? 5 : 4} className="h-24 text-center">
                    No assessment history found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
