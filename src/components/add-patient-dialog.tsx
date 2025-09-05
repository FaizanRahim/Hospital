"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createPatientByDoctor,
  type CreatePatientActionState,
} from "../lib/actions/user-actions";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUserProfile } from "../context/user-profile-context";
import { toast } from "../hooks/use-toast";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Add Patient & Send Assessment
    </Button>
  );
}

export function AddPatientDialog({
  children,
  onSuccess,
  source,
}: {
  children?: ReactNode;
  onSuccess?: () => void;
  source?: "kiosk";
}) {
  const { user } = useUserProfile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initialState: CreatePatientActionState = { status: "idle" };
  const [state, formAction] = useFormState(createPatientByDoctor, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast({ title: "Success", description: state.message });
      setOpen(false); // dialog close
      if (onSuccess) {
        onSuccess(); // refresh patient list
      }
      if (source === "kiosk" && state.patientId) {
        router.push(
          `/kiosk/assessment?patientId=${state.patientId}&doctorId=${user?.uid}`
        );
      }
    } else if (state.status === "error") {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state, onSuccess, source, router, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
             Add Patient
          </Button>
        )}
      </DialogTrigger>

      {/* ✅ Responsive Dialog */}
      <DialogContent className="w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add a New Patient</DialogTitle>
          <DialogDescription>
            This will create a new patient profile and send them an initial
            assessment.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="doctorId" value={user?.uid || ""} />
          <input type="hidden" name="source" value={source} />

          {/* ✅ Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>

          <div>
            <Label htmlFor="patientEmail">Patient Email</Label>
            <Input
              id="patientEmail"
              name="patientEmail"
              type="email"
              required
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          </div>

          {/* ✅ Footer responsive */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
              >
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
