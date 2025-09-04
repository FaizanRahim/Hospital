
'use client';

import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssessmentHistory } from './assessment-history';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Assessment } from '@/lib/firebase/firestore-types';


export function PatientAssessmentView({ user, userProfile }: { user: User, userProfile: DocumentData }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'assessments'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const assessmentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Assessment[];
      
      setAssessments(assessmentsData);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
    setLoading(false);
  }, [user.uid]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const renderAssessmentCard = () => {
    switch (userProfile.assessmentStatus) {
      case 'pending':
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                Your Assessment is Ready
              </CardTitle>
              <CardDescription>
                Your doctor has requested you complete a new assessment. Please complete the PHQ-9 and GAD-7 questionnaires.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/assessment">
                  Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      case 'completed':
        return (
          <Card className="shadow-lg bg-secondary/40">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                Assessment Complete
              </CardTitle>
              <CardDescription>
                Thank you. Your results have been sent to your doctor for review. They will send a new assessment when it&apos;s time.
              </CardDescription>
            </CardHeader>
          </Card>
        );
      default: // This covers 'idle' or undefined status
        return (
          <Card className="shadow-lg bg-secondary/40">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                No Pending Assessment
              </CardTitle>
              <CardDescription>
                Your doctor has not assigned a new assessment to you yet. Check back later.
              </CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };


  return (
    <div className="space-y-8">
        {renderAssessmentCard()}

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
          <>
            <AssessmentHistory 
              userId={user.uid} 
              viewerRole="patient"
              assessments={assessments} 
              onAssessmentChange={fetchAssessments}
            />
          </>
        )}
    </div>
  );
}
