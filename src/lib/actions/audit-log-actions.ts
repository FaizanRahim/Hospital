
'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import type { firestore } from 'firebase-admin';
import type { DocumentData } from 'firebase-admin/firestore';


export interface AuditLog extends DocumentData {
    id: string;
    actorId: string;
    actorEmail?: string; 
    action: string;
    targetType: string;
    targetId: string;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
    details?: Record<string, any>;
}

export async function getAuditLogs(
    viewerId: string, 
    viewerRole: 'doctor' | 'admin' | 'super_admin' | 'patient',
    searchEmail?: string
): Promise<AuditLog[]> {
    const adminDb = getAdminDb();
    try {
        const trimmedEmail = searchEmail?.trim();

        // If no search term is provided, return the most recent logs.
        if (!trimmedEmail) {
            const query = adminDb.collection('audit_logs').orderBy('timestamp', 'desc').limit(100);
            const snapshot = await query.get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : doc.data().timestamp
            })) as AuditLog[];
        }

        // --- Comprehensive Search for HIPAA Compliance ---

        // 1. Find the user ID associated with the email to search for them as a "target".
        let targetUserId: string | null = null;
        const userSnapshot = await adminDb.collection('users').where('email', '==', trimmedEmail).limit(1).get();
        if (!userSnapshot.empty) {
            targetUserId = userSnapshot.docs[0].id;
        }

        // 2. Create parallel queries to find the user as both an "actor" and a "target".
        const queries: firestore.Query[] = [
            // User as the "actor"
            adminDb.collection('audit_logs').where('actorEmail', '==', trimmedEmail).orderBy('timestamp', 'desc').limit(100)
        ];

        if (targetUserId) {
            // User as the "target"
            queries.push(adminDb.collection('audit_logs').where('targetId', '==', targetUserId).orderBy('timestamp', 'desc').limit(100));
        }

        // 3. Execute queries and merge the results.
        const allSnapshots = await Promise.all(queries.map(q => q.get()));
        const auditLogsMap = new Map<string, AuditLog>();

        allSnapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data();
                auditLogsMap.set(doc.id, {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp
                } as AuditLog);
            });
        });
        
        // 4. Sort the combined, de-duplicated logs by timestamp.
        const finalLogs = Array.from(auditLogsMap.values());
        finalLogs.sort((a, b) => {
            const dateA = a.timestamp.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(a.timestamp as any);
            const dateB = b.timestamp.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(b.timestamp as any);
            return dateB.getTime() - dateA.getTime();
        });

        return finalLogs.slice(0, 200); // Return up to 200 combined results.

    } catch (error) {
        console.error("Error fetching audit logs: ", error);
        throw error;
    }
}
