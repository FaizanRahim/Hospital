
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '..//components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Loader2, UserPlus } from 'lucide-react';
import { useUserProfile } from '@/context/user-profile-context';
import { AddPatientDialog } from './add-patient-dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PatientActionsDropdown } from './patient-actions-dropdown';

interface Patient extends DocumentData {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  lastAssessmentAt?: {
      seconds: number;
      nanoseconds: number;
  };
  lastPhq9Score?: number;
  lastGad7Score?: number;
  assessmentStatus?: 'idle' | 'pending' | 'completed';
  doctorId?: string;
}

function getPatientStatus(phq9Score?: number, assessmentStatus?: string): { text: string; variant: 'destructive' | 'secondary' | 'success' | 'outline' } {
  if (assessmentStatus === 'pending') {
    return { text: 'Pending', variant: 'outline' };
  }
  if (phq9Score === undefined) {
    return { text: 'No Assessments', variant: 'secondary' };
  }
  if (phq9Score >= 15) {
    return { text: 'Review Required', variant: 'destructive' };
  }
   if (phq9Score >= 10) {
    return { text: 'Monitor', variant: 'secondary' };
  }
  return { text: 'Stable', variant: 'success' };
}

// The component now accepts a callback to pass its refresh function up to the parent.
export function PatientList({ setOnSuccess }: { setOnSuccess: (callback: () => void) => void }) {
  const { user, userProfile } = useUserProfile();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = useCallback(async () => {
    if (!user || !userProfile || userProfile.role !== 'doctor') {
      setLoading(false);
      return;
    };
    
    setLoading(true);

    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'patient'),
        where('doctorId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const patientsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Patient[];
      
      setPatients(patientsData);

    } catch (error: any) {
      console.error('[PatientList] Error fetching patients:', error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Patients',
        description: `Could not fetch patient list. This is likely a permissions error. Please check that your account has the 'doctor' role and that your patients have the correct 'doctorId' field set in Firestore. (Error: ${error.message})`
      });
      setPatients([]);
    }
    setLoading(false);
  }, [user, userProfile, toast]);

  useEffect(() => {
    if (user && userProfile) {
        fetchPatients();
    }
  }, [user, userProfile, fetchPatients]);
  
  // This effect sends the `fetchPatients` function to the parent component (MyPatientsPage)
  // which then sends it to the layout for the floating button to use.
  useEffect(() => {
    if (setOnSuccess) {
      setOnSuccess(() => fetchPatients);
    }
  }, [setOnSuccess, fetchPatients]);


  if (loading) {
      return (
        <Card>
            <CardContent>
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </CardContent>
        </Card>
      )
  }

  if (patients.length === 0) {
      return (
        <div className="text-center py-12 border-dashed border-2 rounded-lg flex flex-col items-center gap-4">
            <p className="text-muted-foreground">You haven&apos;t added any patients yet.</p>
            <AddPatientDialog onSuccess={fetchPatients}>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Your First Patient
                </Button>
            </AddPatientDialog>
        </div>
      )
  }

  return (
    <>
      <div className="md:hidden grid gap-4">
        {patients.map(patient => {
           const status = getPatientStatus(patient.lastPhq9Score, patient.assessmentStatus);
           const patientName = patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : patient.email;
          return (
            <Card key={patient.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{patientName}</CardTitle>
                    <CardDescription>{patient.email}</CardDescription>
                  </div>
                   <PatientActionsDropdown patient={patient} onActionSuccess={fetchPatients} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={status.variant}>{status.text}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="hidden md:block bg-red-800">
        <Card>
            <CardContent className="pt-6">
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {patients.map((patient) => {
                        const status = getPatientStatus(patient.lastPhq9Score, patient.assessmentStatus);
                        return (
                            <TableRow key={patient.id}>
                                <TableCell className="font-medium">
                                    {patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {patient.email}
                                </TableCell>
                                <TableCell>
                                <Badge variant={status.variant}>{status.text}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                   <PatientActionsDropdown patient={patient} onActionSuccess={fetchPatients} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
