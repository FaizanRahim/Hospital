
'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useUserProfile } from '../context/user-profile-context';
import { addResource, type ResourceActionState } from '../lib/actions/resource-actions';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Add Resource
    </Button>
  );
}

export function AddResourceDialog({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const initialState: ResourceActionState = { status: 'idle' };
  const [state, formAction] = useFormState(addResource, initialState);

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast({ description: state.message });
      onSuccess?.();
      setOpen(false);
    }
    if (state.status === 'error' && state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, onSuccess]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
          <DialogDescription>
            Add a new mental health resource to your personal library.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="doctorId" value={user.uid} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Headspace App" required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A short description of the resource." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" type="url" placeholder="https://example.com" required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
               <Select name="category" defaultValue='Coping'>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coping">Coping</SelectItem>
                    <SelectItem value="Crisis">Crisis</SelectItem>
                    <SelectItem value="Therapy">Therapy</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          {state.status === 'error' && (
            <p className="text-sm font-medium text-destructive mb-4">{state.error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
