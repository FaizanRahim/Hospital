"use client";

import { PatientList } from "../../../components/patient-list";
import { Suspense, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { AddPatientDialog } from "../../../components/add-patient-dialog";
import { Button } from "../../../components/ui/button";
import { useActionCallback } from "../../../context/action-callback-context";

function MyPatientsPageImpl() {
  const { setCallback } = useActionCallback();
  const [refreshCallback, setRefreshCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (refreshCallback) {
      setCallback(() => refreshCallback);
    }
    return () => setCallback(null);
  }, [refreshCallback, setCallback]);

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Section */}
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Patients
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            A list of all patients linked to your account.
          </p>
        </div>

        {/* Right Section - Button */}
        <div className="flex justify-center sm:justify-end">
          <AddPatientDialog onSuccess={refreshCallback || undefined}>
            <Button className="w-full sm:w-auto flex items-center justify-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </AddPatientDialog>
        </div>
      </div>

      {/* Patient List */}
      <div className="overflow-x-auto">
        <PatientList setOnSuccess={setRefreshCallback} />
      </div>
    </div>
  );
}

export default function MyPatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <MyPatientsPageImpl />
    </Suspense>
  );
}
