'use client';

import { getPatientDetailsForDoctor } from '@/lib/actions/user-actions';
import { useUserProfile } from '@/context/user-profile-context';
import { AssessmentHistory } from '@/components/assessment-history';
import { AssessmentChart } from '@/components/assessment-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { logViewedPatientHistory } from '@/lib/actions/user-actions';
import { notFound, redirect } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { type Assessment } from '@/lib/firebase/firestore-types';
import type { DocumentData } from 'firebase-admin/firestore';

export default function PatientPage({ params }: { params: { patientId: string } }) {
  const { user, userProfile: currentUserProfile } = useUserProfile();
  const [patientProfile, setPatientProfile] = useState<(DocumentData & { dateOfBirth?: string }) | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { patientId } = params;

  const fetchData = useCallback(async () => {
    if (!user || !currentUserProfile) return;
    if (currentUserProfile.role !== 'doctor') {
      redirect('/dashboard');
      return;
    }

    setLoading(true);
    
    // Log the viewing event for HIPAA compliance
    const formData = new FormData();
    formData.append('doctorId', user.uid);
    formData.append('patientId', patientId);
    logViewedPatientHistory(formData);

    const { patientProfile, assessments, error } = await getPatientDetailsForDoctor(patientId, user.uid);
    
    if (error || !patientProfile) {
      setError(error || 'Patient not found.');
    } else {
      setPatientProfile(patientProfile);
      setAssessments(assessments);
    }
    setLoading(false);
  }, [patientId, user, currentUserProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    )
  }

  if (error) {
    // This will trigger the nearest not-found.js or error.js boundary
    notFound();
  }
  
  if (!patientProfile) {
    return null; // Or a more specific "not found" component
  }

  const patientName = patientProfile.firstName && patientProfile.lastName ? `${patientProfile.firstName} ${patientProfile.lastName}` : patientProfile.email;
  const fallbackInitial = patientProfile.firstName ? patientProfile.firstName.charAt(0) : (patientProfile.email?.charAt(0) || '');

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-2xl">{fallbackInitial.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patientName}</h1>
          <p className="text-muted-foreground">{patientProfile.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
           <div><span className="font-semibold">Date of Birth:</span> {patientProfile.dateOfBirth ? format(new Date(patientProfile.dateOfBirth), 'PPP') : 'N/A'}</div>
           <div><span className="font-semibold">Phone:</span> {patientProfile.phone || 'N/A'}</div>
           <div><span className="font-semibold">Emergency Contact:</span> {patientProfile.emergencyContactName || 'N/A'}</div>
           <div><span className="font-semibold">Emergency Phone:</span> {patientProfile.emergencyContactPhone || 'N/A'}</div>
        </CardContent>
      </Card>

      <AssessmentChart assessments={assessments} />
      <AssessmentHistory
        userId={patientId}
        viewerRole="doctor"
        assessments={assessments}
        onAssessmentChange={fetchData}
      />
    </div>
  );
}
