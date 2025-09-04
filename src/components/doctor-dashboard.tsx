
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDoctorDashboardStats, type DoctorDashboardStats } from '@/lib/actions/doctor-actions';
import { collection, query, where, getDocs, orderBy, limit, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserProfile } from '@/context/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Loader2, Users, ClipboardList, CheckCircle, NotebookText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AssessmentDetails } from './assessment-details';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Assessment } from '@/lib/firebase/firestore-types';

function StatCard({ title, value, isLoading, icon: Icon, description }: { title: string; value: string | number; isLoading: boolean; icon?: React.ElementType, description?: string }) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent className="pt-2">
           {isLoading ? (
             <div className="h-8 flex items-center">
                 <Loader2 className="h-6 w-6 animate-spin" />
            </div>
           ): (
            <div className="text-2xl font-bold">{value}</div>
           )}
           {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>
    );
}

export function DoctorDashboard() {
  const { user } = useUserProfile();
  const [stats, setStats] = useState<DoctorDashboardStats>({ activePatients: 0, pendingOrders: 0, readyForReview: 0 });
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
        const [dashboardStats, assessmentsSnapshot] = await Promise.all([
            getDoctorDashboardStats(user.uid),
            getDocs(query(
                collection(db, 'assessments'),
                where('doctorId', '==', user.uid),
                where('recommendationGenerated', '==', false),
                orderBy('createdAt', 'desc'),
                limit(5)
            ))
        ]);

        setStats(dashboardStats);

        if (!assessmentsSnapshot.empty) {
            const patientIds = [...new Set(assessmentsSnapshot.docs.map(doc => doc.data().userId).filter(Boolean))];
            const patientDataMap = new Map<string, DocumentData>();

            if (patientIds.length > 0) {
                const patientsQuery = query(collection(db, 'users'), where('__name__', 'in', patientIds));
                const patientsSnapshot = await getDocs(patientsQuery);
                patientsSnapshot.forEach(doc => {
                    patientDataMap.set(doc.id, doc.data());
                });
            }

            const assessmentsData = assessmentsSnapshot.docs.map(doc => {
                const assessment = { id: doc.id, ...doc.data() } as Assessment;
                const patientInfo = patientDataMap.get(assessment.userId);
                const patientName = patientInfo
                    ? `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() || patientInfo.email
                    : 'Unknown Patient';
                return { ...assessment, patientName };
            });
            setRecentAssessments(assessmentsData);
        } else {
          setRecentAssessments([]);
        }

    } catch (error) {
      console.error("Error fetching doctor dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchDashboardData();
    }
  }, [user, fetchDashboardData]);
  
  const handleNoteAdded = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Active Patients"
            value={stats.activePatients}
            isLoading={loading}
            icon={Users}
            description="Patients linked to your account."
          />
          <StatCard
            title="Pending Assessments"
            value={stats.pendingOrders}
            isLoading={loading}
            icon={ClipboardList}
            description="Assessments sent but not completed."
          />
          <StatCard
            title="Ready for Review"
            value={stats.readyForReview}
            isLoading={loading}
            icon={CheckCircle}
            description="Completed assessments awaiting review."
          />
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ready for Review</CardTitle>
           <CardDescription>
              An overview of the most recently completed assessments that need your attention.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : recentAssessments.length > 0 ? (
                recentAssessments.map((assessment) => {
                  return (
                    <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.patientName || 'Unknown Patient'}</TableCell>
                        <TableCell>{assessment.createdAt ? format(assessment.createdAt.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm"><NotebookText className="mr-2 h-4 w-4"/>View Details</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                    <DialogHeader>
                                    <DialogTitle>Assessment Details: {assessment.createdAt ? format(assessment.createdAt.toDate(), 'PPP') : ''}</DialogTitle>
                                    <DialogDescription>
                                        A detailed view of the assessment for {assessment.patientName || 'this patient'}.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="flex-1">
                                    <div className="pr-6">
                                        <AssessmentDetails assessment={assessment} viewerRole="doctor" onNoteAdded={handleNoteAdded} />
                                    </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/patient/${assessment.userId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View History
                                </Link>
                            </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No recent activity found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
