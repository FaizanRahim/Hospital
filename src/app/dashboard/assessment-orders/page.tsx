
'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useUserProfile } from '../../../context/user-profile-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Loader2, CheckCircle, Clock, NotebookText } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { AssessmentDetails } from '../../../components/assessment-details';
import { type Assessment } from '../../../lib/firebase/firestore-types';

interface AssessmentRequest extends DocumentData {
  id: string;
  patientName: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  phq9Score?: number;
  gad7Score?: number;
  assessmentId?: string;
  userId: string;
}

function AssessmentOrdersContent() {
  const { user, userProfile, loading: profileLoading } = useUserProfile();
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const fetchAssessmentRequests = useCallback(async () => {
    if (!user || !userProfile || userProfile.role !== 'doctor') {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
        const patientsQuery = query(collection(db, 'users'), where('doctorId', '==', user.uid));
        const patientsSnapshot = await getDocs(patientsQuery);
        const patientsMap = new Map(patientsSnapshot.docs.map(doc => [doc.id, doc.data()]));

        const requestsQuery = query(
            collection(db, 'assessments'),
            where('doctorId', '==', user.uid)
        );
        const requestsSnapshot = await getDocs(requestsQuery);

        let requestsData = requestsSnapshot.docs.map((doc) => {
            const data = doc.data();
            const patientInfo = patientsMap.get(data.userId);
            const patientName = patientInfo
                ? `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() || patientInfo.email
                : 'Unknown Patient';

            return {
                id: doc.id,
                patientName,
                ...data,
            } as AssessmentRequest;
        });

        requestsData = requestsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

        setAssessmentRequests(requestsData);

    } catch (error: any) {
      console.error('[AssessmentOrders] Error fetching assessment requests:', error.message);
    } finally {
        setLoading(false);
    }
  }, [user, userProfile]);

  const fetchFullAssessment = useCallback(async (assessmentId: string) => {
    try {
      const assessmentDocRef = doc(db, 'assessments', assessmentId);
      const assessmentDocSnap = await getDoc(assessmentDocRef);

      if (assessmentDocSnap.exists()) {
        const data = assessmentDocSnap.data();
        setSelectedAssessment({
            id: assessmentDocSnap.id,
            ...data
        } as Assessment);
      } else {
        console.warn('[AssessmentOrders] Full assessment not found for ID:', assessmentId);
        setSelectedAssessment(null);
      }
    } catch (error: any) {
      console.error('[AssessmentOrders] Error fetching full assessment:', error.message);
      setSelectedAssessment(null);
    }
  }, []);

  useEffect(() => {
    if (!profileLoading && user && userProfile) {
      fetchAssessmentRequests();
    }
  }, [profileLoading, user, userProfile, fetchAssessmentRequests]);

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
        <h1 className="text-3xl font-bold tracking-tight">Assessment Request History</h1>
        <p className="text-muted-foreground">
          A complete log of all assessments that have been sent to your patients.
        </p>
      </div>

       <div className="md:hidden grid gap-4">
        {assessmentRequests.length > 0 ? (
          assessmentRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="text-base">{request.patientName}</CardTitle>
                <CardDescription>
                  Sent: {format(new Date(request.createdAt.seconds * 1000), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                 <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    {request.phq9Score !== undefined ? (
                        <Badge variant="success">
                            <CheckCircle className="mr-2 h-3 w-3" />
                            Completed
                        </Badge>
                    ) : (
                        <Badge variant="outline">
                            <Clock className="mr-2 h-3 w-3" />
                            Pending
                        </Badge>
                    )}
                 </div>
                 <div className="flex justify-between">
                    <span className="font-medium">Scores:</span>
                    {request.phq9Score !== undefined ? (
                        <span>PHQ-9: {request.phq9Score} / GAD-7: {request.gad7Score}</span>
                    ) : (
                        <span className="text-muted-foreground">N/A</span>
                    )}
                 </div>
              </CardContent>
              <CardContent>
                 {request.phq9Score !== undefined && request.id && (
                  <Dialog onOpenChange={(open) => !open && setSelectedAssessment(null)}>
                      <DialogTrigger asChild>
                          <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => request.id && fetchFullAssessment(request.id)}
                          >
                              <NotebookText className="mr-2 h-4 w-4"/>View Details
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                          <DialogHeader>
                          <DialogTitle>Assessment Details: {format(new Date(request.createdAt.seconds * 1000), 'PPP')}</DialogTitle>
                          <DialogDescription>
                              A detailed view of the assessment for {request.patientName}.
                          </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="flex-1">
                          <div className="pr-6">
                              {selectedAssessment ? (
                                  <AssessmentDetails assessment={selectedAssessment} viewerRole="doctor" />
                              ) : (
                                  <div className="flex justify-center items-center h-32">
                                      <Loader2 className="h-8 w-8 animate-spin" />
                                      Loading...
                                  </div>
                              )}
                          </div>
                          </ScrollArea>
                      </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
             <div className="text-center py-12 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">No assessment requests found.</p>
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
                    <TableHead>Date Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PHQ-9 / GAD-7</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assessmentRequests.length > 0 ? (
                    assessmentRequests.map((request) => (
                        <TableRow key={request.id}>
                        <TableCell className="font-medium">
                            <Button variant="link" asChild className="p-0 h-auto">
                            <Link href={`/dashboard/patient/${request.userId}`}>{request.patientName}</Link>
                            </Button>
                        </TableCell>
                        <TableCell>
                            {format(new Date(request.createdAt.seconds * 1000), 'PPp')}
                        </TableCell>
                        <TableCell>
                            {request.phq9Score !== undefined ? (
                            <Badge variant="success">
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Completed
                            </Badge>
                            ) : (
                            <Badge variant="outline">
                                <Clock className="mr-2 h-3 w-3" />
                                Pending
                            </Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            {request.phq9Score !== undefined ? (
                            <span>{request.phq9Score} / {request.gad7Score}</span>
                            ) : (
                            <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            {request.phq9Score !== undefined && request.id && (
                            <Dialog onOpenChange={(open) => !open && setSelectedAssessment(null)}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => request.id && fetchFullAssessment(request.id)}
                                    >
                                        <NotebookText className="mr-2 h-4 w-4"/>View Details
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                    <DialogHeader>
                                    <DialogTitle>Assessment Details: {format(new Date(request.createdAt.seconds * 1000), 'PPP')}</DialogTitle>
                                    <DialogDescription>
                                        A detailed view of the assessment for {request.patientName}.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="flex-1">
                                    <div className="pr-6">
                                        {selectedAssessment ? (
                                            <AssessmentDetails assessment={selectedAssessment} viewerRole="doctor" />
                                        ) : (
                                            <div className="flex justify-center items-center h-32">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                Loading assessment details...
                                            </div>
                                        )}
                                    </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                            )}
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        No assessment requests found.
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

export default function AssessmentOrdersPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <AssessmentOrdersContent />
        </Suspense>
    )
}
