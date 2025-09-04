
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, getDoc, type DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserProfile } from '@/context/user-profile-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Eye, NotebookText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AssessmentDetails } from '@/components/assessment-details';
import { type Assessment } from '@/lib/firebase/firestore-types';

interface CompletedAssessment extends DocumentData {
  id: string; 
  patientId: string;
  patientName: string;
  createdAt: Timestamp;
  phq9Score?: number;
  gad7Score?: number;
}

function ReadyForReviewContent() {
  const { user, userProfile, loading: profileLoading } = useUserProfile();
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const fetchCompletedAssessments = useCallback(async () => {
    if (!user || !userProfile || userProfile.role !== 'doctor') {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
        const patientsQuery = query(collection(db, 'users'), where('doctorId', '==', user.uid));
        const patientsSnapshot = await getDocs(patientsQuery);
        const patientsMap = new Map(patientsSnapshot.docs.map(doc => [doc.id, doc.data()]));

        // Corrected query to fetch completed assessments that are ready for review
        const requestsQuery = query(
            collection(db, 'assessments'),
            where('doctorId', '==', user.uid),
            where('recommendationGenerated', '==', false)
        );
        const requestsSnapshot = await getDocs(requestsQuery);

        let assessmentsData = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Filter out assessments that haven't been scored yet (i.e. not completed)
            if (typeof data.phq9Score === 'undefined') {
                return null;
            }
            const patientInfo = patientsMap.get(data.userId);
            const patientName = patientInfo
                ? `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() || patientInfo.email
                : 'Unknown Patient';

            return {
                id: doc.id,
                patientId: data.userId,
                patientName,
                ...data,
            } as CompletedAssessment;
        }).filter(Boolean) as CompletedAssessment[];


        assessmentsData = assessmentsData.sort((a, b) => {
            const scoreA = a.phq9Score ?? -1;
            const scoreB = b.phq9Score ?? -1;
            return scoreB - scoreA;
        });

        setCompletedAssessments(assessmentsData);

    } catch (error: any) {
      console.error('[ReadyForReview] Error fetching completed assessments:', error.message);
    } finally {
        setLoading(false);
    }
  }, [user, userProfile]);

    const fetchAssessmentDetails = async (assessmentId: string) => {
        try {
            const assessmentDocRef = doc(db, 'assessments', assessmentId);
            const assessmentDocSnap = await getDoc(assessmentDocRef);
            if (assessmentDocSnap.exists()) {
                setSelectedAssessment({ id: assessmentDocSnap.id, ...assessmentDocSnap.data() } as Assessment);
            } else {
                console.error('No such assessment document!');
                setSelectedAssessment(null);
            }
        } catch (error) {
            console.error('Error fetching assessment details:', error);
            setSelectedAssessment(null);
        }
    };
    
    const handleNoteAdded = () => {
        fetchCompletedAssessments();
    };

    useEffect(() => {
        if (!profileLoading && user && userProfile) {
        fetchCompletedAssessments();
        }
    }, [profileLoading, user, userProfile, fetchCompletedAssessments]);


  if (loading) {
    return (
        <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Ready for Review</h1>
        <p className="text-muted-foreground">
          A list of all patients who have completed an assessment, ordered by the highest PHQ-9 score.
        </p>
      </div>

       <div className="md:hidden grid gap-4">
            {completedAssessments.length > 0 ? (
                completedAssessments.map((assessment) => (
                    <Card key={assessment.id}>
                        <CardHeader>
                             <CardTitle className="text-base">{assessment.patientName}</CardTitle>
                             <CardDescription>
                                Completed: {assessment.createdAt ? format(assessment.createdAt.toDate(), 'PP') : 'N/A'}
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">PHQ-9:</span>
                                <Badge variant={assessment.phq9Score && assessment.phq9Score >= 15 ? "destructive" : "secondary"}>
                                    {assessment.phq9Score ?? 'N/A'}
                                </Badge>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="font-medium">GAD-7:</span>
                                <Badge variant={assessment.gad7Score && assessment.gad7Score >= 15 ? "destructive" : "secondary"}>
                                    {assessment.gad7Score ?? 'N/A'}
                                </Badge>
                            </div>
                        </CardContent>
                        <CardContent className="flex flex-col sm:flex-row gap-2">
                             <Dialog onOpenChange={(isOpen) => {
                                  if (!isOpen) { setSelectedAssessment(null); }
                              }}>
                                  <DialogTrigger asChild>
                                      <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full"
                                          onClick={() => fetchAssessmentDetails(assessment.id)}
                                      >
                                          <NotebookText className="mr-2 h-4 w-4"/>View Details
                                      </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                      <DialogHeader>
                                      <DialogTitle>Assessment Details: {selectedAssessment ? format(selectedAssessment.createdAt.toDate(), 'PPP') : 'Loading...'}</DialogTitle>
                                      <DialogDescription>A detailed view for {assessment.patientName}.</DialogDescription>
                                      </DialogHeader>
                                      <ScrollArea className="flex-1 pr-6">
                                        {selectedAssessment ? (
                                            <AssessmentDetails assessment={selectedAssessment} viewerRole="doctor" onNoteAdded={handleNoteAdded} />
                                        ) : (
                                            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                        )}
                                      </ScrollArea>
                                  </DialogContent>
                              </Dialog>
                              <Button asChild variant="outline" size="sm" className="w-full">
                                  <Link href={`/dashboard/patient/${assessment.patientId}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View History
                                  </Link>
                              </Button>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-12 border-dashed border-2 rounded-lg">
                    <p className="text-muted-foreground">No completed assessments found.</p>
                </div>
            )}
       </div>

      <div className="hidden md:block">
        <Card>
            <CardContent className="pt-6">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Completed On</TableHead>
                    <TableHead>PHQ-9</TableHead>
                    <TableHead>GAD-7</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {completedAssessments.length > 0 ? (
                    completedAssessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                        <TableCell className="font-medium">
                            {assessment.patientName}
                        </TableCell>
                        <TableCell>
                            {assessment.createdAt
                            ? format(assessment.createdAt.toDate(), 'PP')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={assessment.phq9Score && assessment.phq9Score >= 15 ? "destructive" : "secondary"}>
                            {assessment.phq9Score ?? 'N/A'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={assessment.gad7Score && assessment.gad7Score >= 15 ? "destructive" : "secondary"}>
                            {assessment.gad7Score ?? 'N/A'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Dialog onOpenChange={(isOpen) => {
                                    if (!isOpen) { setSelectedAssessment(null); }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchAssessmentDetails(assessment.id)}
                                        >
                                            <NotebookText className="mr-2 h-4 w-4"/>View Details
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                        <DialogHeader>
                                        <DialogTitle>Assessment Details: {selectedAssessment ? format(selectedAssessment.createdAt.toDate(), 'PPP') : 'Loading...'}</DialogTitle>
                                        <DialogDescription>
                                            A detailed view of the assessment for {assessment.patientName}.
                                        </DialogDescription>
                                        </DialogHeader>
                                        <ScrollArea className="flex-1">
                                        <div className="pr-6">
                                            {selectedAssessment ? (
                                                <AssessmentDetails assessment={selectedAssessment} viewerRole="doctor" onNoteAdded={handleNoteAdded} />
                                            ) : (
                                                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Loading assessment details...</div>
                                            )}
                                        </div>
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/patient/${assessment.patientId}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View History
                                    </Link>
                                </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No completed assessments found.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReadyForReviewPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ReadyForReviewContent />
        </Suspense>
    )
}
