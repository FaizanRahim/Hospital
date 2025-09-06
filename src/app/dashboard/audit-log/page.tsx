
'use client';

import { useEffect, useState, useCallback, useTransition, Suspense } from 'react';
import { useUserProfile } from '../../../context/user-profile-context';
import { getAuditLogs, type AuditLog } from '../../../lib/actions/audit-log-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../../../components/ui/badge';
import { redirect } from 'next/navigation';


function AuditLogContent() {
    const { user, userProfile, loading: profileLoading } = useUserProfile();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');
    const [isPending, startTransition] = useTransition();

    const fetchLogs = useCallback((email?: string) => {
        if (!user || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) return;
        
        setLoading(true);
        startTransition(async () => {
            try {
                const fetchedLogs = await getAuditLogs(user.uid, userProfile.role, email);
                setLogs(fetchedLogs);
            } catch (error) {
                console.error("Failed to fetch audit logs", error);
            } finally {
                setLoading(false);
            }
        });
    }, [user, userProfile]);

    useEffect(() => {
        if (!profileLoading && userProfile) {
            if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
                redirect('/dashboard');
            } else {
                 fetchLogs();
            }
        }
    }, [fetchLogs, userProfile, profileLoading]);
    
    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        fetchLogs(searchEmail);
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return format(date, 'PPp');
    };

    if (profileLoading || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            A detailed record of all significant activities on the platform for compliance and security monitoring.
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
                type="email"
                placeholder="Search by actor or patient email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="max-w-xs"
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
        </form>

        <Card>
            <CardContent className="pt-6">
                {(loading || isPending) ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : logs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                                        <TableCell>{log.actorEmail || 'N/A'}</TableCell>
                                        <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                                        <TableCell>
                                             {log.targetType && log.targetId &&
                                                <span className="font-mono text-xs max-w-xs truncate block">{log.targetType}:{log.targetId}</span>
                                             }
                                        </TableCell>
                                        <TableCell>
                                          {log.details && (
                                            <pre className="text-xs bg-muted/50 p-2 rounded-md font-mono whitespace-pre-wrap break-all max-w-xs sm:max-w-sm">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                          )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="h-24 text-center flex items-center justify-center">
                        No audit logs found.
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    );
}

export default function AuditLogPage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <AuditLogContent />
      </Suspense>
    );
}
