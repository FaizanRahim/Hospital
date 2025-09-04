
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  testUserQuery,
  testRecentActivityQuery,
  testFirestoreWrite,
  testAuthToken,
  testMetadataServer,
  setRoleForUser,
  getDoctorsForSelection,
  getPatientCountForDoctor,
  type DoctorOption
} from '@/lib/actions/diagnostic-actions';
import { useUserProfile } from '@/context/user-profile-context';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';

type TestResult = {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
  stack?: string;
  message?: string;
  documentsFound?: number;
  token_preview?: string;
};

type TestState = {
  [key: string]: {
    status: 'idle' | 'running' | 'completed';
    result: TestResult | null;
  };
};

const tests = [
  { id: 'userQuery', label: 'Query for Users Collection', run: testUserQuery },
  { id: 'recentActivity', label: 'Query with Index (Recent Activity)', run: testRecentActivityQuery },
  { id: 'firestoreWrite', label: 'Firestore Write/Delete Operation', run: testFirestoreWrite },
  { id: 'customToken', label: 'Generate Custom Auth Token', run: testAuthToken },
  { id: 'metadataServer', label: 'Check Service Acct Credentials', run: testMetadataServer },
];

const RoleSchema = z.enum(['patient', 'doctor', 'admin', 'super_admin']);

function DiagnosticsContent() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const [testState, setTestState] = useState<TestState>(
    tests.reduce((acc, test) => ({ ...acc, [test.id]: { status: 'idle', result: null } }), {})
  );

  const [roleFormData, setRoleFormData] = useState({ uid: '', role: 'patient' });
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    if (!profileLoading && (!userProfile || (userProfile.role !== 'super_admin' && userProfile.role !== 'admin'))) {
      router.push('/dashboard');
    } else {
        const fetchDoctors = async () => {
            const doctorList = await getDoctorsForSelection();
            setDoctors(doctorList);
        };
        fetchDoctors();
    }
  }, [profileLoading, userProfile, router]);


  const handleRunTest = async (testId: string, runTestFunc: () => Promise<TestResult>) => {
    setTestState(prev => ({ ...prev, [testId]: { status: 'running', result: null } }));
    const result = await runTestFunc();
    setTestState(prev => ({ ...prev, [testId]: { status: 'completed', result } }));
  };
  
  const handleSetRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const validatedRole = RoleSchema.safeParse(roleFormData.role);
    if (!validatedRole.success) {
        toast({ variant: 'destructive', title: "Invalid Role" });
        return;
    }
    const result = await setRoleForUser(roleFormData.uid, validatedRole.data);
    if (result.success) {
        toast({ title: "Success", description: result.message });
    } else {
        toast({ variant: 'destructive', title: "Error", description: result.error });
    }
  };

  const handleDoctorSelection = async (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    if (!doctorId) {
        setPatientCount(null);
        return;
    }
    setCountLoading(true);
    setPatientCount(null);
    const result = await getPatientCountForDoctor(doctorId);
    if (result.success) {
        setPatientCount(result.count ?? 0);
    } else {
        toast({ variant: 'destructive', title: "Error", description: result.error });
        setPatientCount(null);
    }
    setCountLoading(false);
  }

  if (profileLoading || !userProfile || (userProfile.role !== 'super_admin' && userProfile.role !== 'admin')) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }

  const doctorOptions = doctors.map(d => ({ value: d.id, label: d.name }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
          <CardDescription>Run tests to check the health of your backend services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map(test => (
            <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{test.label}</p>
                {testState[test.id].status === 'completed' && testState[test.id].result && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {testState[test.id].result!.success ? (
                       <p className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-2"/>Success: {testState[test.id].result!.message}</p>
                    ) : (
                       <p className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-2"/>Error: {testState[test.id].result!.error}</p>
                    )}
                    {testState[test.id].result!.data && <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto"><code>{JSON.stringify(testState[test.id].result!.data, null, 2)}</code></pre>}
                  </div>
                )}
              </div>
              <Button onClick={() => handleRunTest(test.id, test.run)} disabled={testState[test.id].status === 'running'}>
                {testState[test.id].status === 'running' ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Run Test'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Patient Count</CardTitle>
          <CardDescription>Select a doctor to test the query for their linked patient count.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="w-full max-w-sm">
                <Combobox
                    options={doctorOptions}
                    value={selectedDoctorId}
                    onChange={handleDoctorSelection}
                    placeholder="Select a doctor..."
                    searchPlaceholder="Search doctors..."
                    notFoundText="No doctors found."
                />
            </div>
            {countLoading && <div className="flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> <p>Loading count...</p></div>}
            {patientCount !== null && (
                <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-medium">Patient Count: <span className="text-2xl font-bold ml-2">{patientCount}</span></p>
                </div>
            )}
        </CardContent>
      </Card>

      {userProfile.role === 'super_admin' && (
        <Card>
            <CardHeader>
                <CardTitle>Set User Role</CardTitle>
                <CardDescription>Manually set a user&apos;s role in both Auth and Firestore.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSetRole} className="space-y-4">
                    <div>
                        <Label htmlFor="uid">User ID (UID)</Label>
                        <Input id="uid" value={roleFormData.uid} onChange={(e) => setRoleFormData({...roleFormData, uid: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="role">Role</Label>
                        <select id="role" value={roleFormData.role} onChange={(e) => setRoleFormData({...roleFormData, role: e.target.value })} className="w-full p-2 border rounded-md">
                            {RoleSchema.options.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                    <Button type="submit">Set Role</Button>
                </form>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DiagnosticsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <DiagnosticsContent />
        </Suspense>
    )
}
