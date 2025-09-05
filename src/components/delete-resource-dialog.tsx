
'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { deleteResource, type ResourceActionState } from '../lib/actions/resource-actions';
import { Button } from '../components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
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


export function DeleteResourceDialog({
  resourceId,
  onSuccess,
}: {
  resourceId: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const initialState: ResourceActionState = { status: 'idle' };
  const [state, formAction] = useFormState(deleteResource, initialState);

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast({ description: state.message });
      onSuccess?.();
    }
    if (state.status === 'error' && state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, onSuccess]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the resource from your library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <form action={formAction}>
            <input type="hidden" name="resourceId" value={resourceId} />
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">
                {false ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Resource
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
