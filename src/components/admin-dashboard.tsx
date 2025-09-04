
'use client';

import { useEffect, useState } from 'react';
import { getAdminBillingData, type AdminBillingData } from '@/lib/actions/admin-billing-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, User, DollarSign, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export function AdminDashboard() {
  const [data, setData] = useState<AdminBillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getAdminBillingData();
      setData(result);
      setLoading(false);
    }
    fetchData();
  }, []);

  const stats = data?.stats;
  const topDoctors = data?.topDoctors || [];
  
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Revenue" 
              value={`$${stats?.totalRevenue.toFixed(2) ?? '0.00'}`}
              description="All-time gross volume"
              isLoading={loading}
              icon={DollarSign}
            />
            <StatCard 
              title="Revenue (Last 7 Days)" 
              value={`$${stats?.weeklyRevenue.toFixed(2) ?? '0.00'}`}
              description="Revenue from the past week"
              isLoading={loading}
              icon={Activity}
            />
             <StatCard 
              title="Active Doctors" 
              value={stats?.totalDoctors || 0}
              description="Total number of doctor accounts"
              isLoading={loading}
              icon={User}
            />
            <StatCard 
              title="Total Patients" 
              value={stats?.totalPatients || 0} 
              description="Total number of patient accounts"
              isLoading={loading}
              icon={Users}
            />
        </div>

        <Card>
          <CardHeader>
              <CardTitle>Top Doctors</CardTitle>
              <CardDescription>A list of doctors with the most linked patients.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Patient Count</TableHead>
                    <TableHead className="text-right">Total Assessments</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                          </TableCell>
                        </TableRow>
                    ) : topDoctors.length > 0 ? topDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{doctor.patientCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{doctor.totalAssessments}</TableCell>
                    </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No doctor data available.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
    </div>
  );
}
