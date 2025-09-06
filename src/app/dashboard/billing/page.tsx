
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useUserProfile } from '../../../context/user-profile-context';
import { getBillingData, type BillingData, type Doctor } from '../../../lib/actions/billing-actions';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { format } from 'date-fns';
import { Combobox } from '../../../components/ui/combobox';

function BillingStats({ stats }: { stats: BillingData['stats'] }) {
  if (!stats.currentPlan) return null; // Don't render if stats are for admin view
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.currentPlan}</p>
          <p className="text-xs text-muted-foreground">Base price of ${stats.nextInvoiceAmount.toFixed(2)} per month.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assessments Used</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.assessmentsUsed} / {stats.assessmentsLimit}</p>
          <p className="text-xs text-muted-foreground">
            {stats.assessmentsLimit - stats.assessmentsUsed} assessments remaining this cycle.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Next Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${stats.nextInvoiceAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            Due on {format(stats.nextInvoiceDate, 'PPP')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.paymentMethod}</p>
          <p className="text-xs text-muted-foreground">Expires {stats.paymentMethodExpires}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingContent() {
  const { user, userProfile, loading: profileLoading } = useUserProfile();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      const data = await getBillingData(user.uid, isAdmin);
      setBillingData(data);
      setLoading(false);
    }
    if (!profileLoading && user) {
      fetchData();
    }
  }, [user, isAdmin, profileLoading]);

  const filteredInvoices = billingData?.invoices.filter(invoice => 
    selectedDoctorId === 'all' || invoice.doctorId === selectedDoctorId
  );
  
  const doctorOptions = [
      { value: 'all', label: 'All Doctors' },
      ...(billingData?.doctors?.map((doctor: Doctor) => ({
          value: doctor.id,
          label: doctor.name,
      })) || []),
  ];

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="text-muted-foreground">
          View your billing history and manage your subscription details.
        </p>
      </div>

      {!isAdmin && billingData && <BillingStats stats={billingData.stats} />}
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                 <CardTitle>Invoice History</CardTitle>
                 <CardDescription>A record of all your past payments.</CardDescription>
            </div>
            {isAdmin && (
                 <div className="w-full md:w-[250px]">
                    <Combobox
                        options={doctorOptions}
                        value={selectedDoctorId}
                        onChange={setSelectedDoctorId}
                        placeholder="Filter by doctor..."
                        searchPlaceholder="Search doctors..."
                        notFoundText="No doctors found."
                    />
                </div>
            )}
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden grid gap-4">
            {filteredInvoices && filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice {invoice.invoiceId}</CardTitle>
                    <CardDescription>{format(new Date(invoice.date.seconds * 1000), 'PPP')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {isAdmin && (
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Doctor:</span>
                            <span>{invoice.doctorName}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Amount:</span>
                        <span className="font-bold">${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Status:</span>
                        <Badge variant={invoice.paymentStatus === 'Paid' ? 'success' : 'outline'}>
                            {invoice.paymentStatus}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Payment:</span>
                        <span>{invoice.paymentMethod}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
                 <div className="text-center py-12 border-dashed border-2 rounded-lg">
                    <p className="text-muted-foreground">No invoices found.</p>
                </div>
            )}
          </div>
          
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  {isAdmin && <TableHead>Doctor</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices && filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                      {isAdmin && <TableCell>{invoice.doctorName}</TableCell>}
                      <TableCell>{format(new Date(invoice.date.seconds * 1000), 'PPP')}</TableCell>
                      <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.paymentStatus === 'Paid' ? 'success' : 'outline'}>
                          {invoice.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{invoice.paymentMethod}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <BillingContent />
      </Suspense>
    )
}
