
'use server';

import { getAdminDb, getAdminAuth } from '../firebase/admin';
import { GoogleAuth } from 'google-auth-library';
import { z } from 'zod';
import type { Timestamp } from 'firebase-admin/firestore';

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

// A helper function to run tests and catch errors
async function runTest(testLogic: () => Promise<any>): Promise<TestResult> {
  try {
    const result = await testLogic();
    return result;
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'An unknown error occurred.',
      code: e.code || 'N/A',
      stack: e.stack,
    };
  }
}

export async function testUserQuery(): Promise<TestResult> {
  return runTest(async () => {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection('users').limit(1).get();
    return {
      success: true,
      documentsFound: snapshot.size,
      data: snapshot.docs.map(doc => doc.id),
      message: 'Successfully queried the "users" collection.'
    };
  });
}

export async function testRecentActivityQuery(): Promise<TestResult> {
  return runTest(async () => {
    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection('assessments')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    const serializableData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Timestamp to a serializable format (ISO string)
        if (data.createdAt && (data.createdAt as Timestamp).toDate) {
            data.createdAt = (data.createdAt as Timestamp).toDate().toISOString();
        }
        if (data.lastAssessmentAt && (data.lastAssessmentAt as Timestamp).toDate) {
            data.lastAssessmentAt = (data.lastAssessmentAt as Timestamp).toDate().toISOString();
        }
        return data;
    });

    return {
      success: true,
      documentsFound: snapshot.size,
      data: serializableData,
      message: "Query on 'assessments' collection with an existing index succeeded.",
    };
  });
}

export async function testFirestoreWrite(): Promise<TestResult> {
  return runTest(async () => {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('diagnostics').doc('write-test');
    await docRef.set({ timestamp: new Date(), status: 'testing' });
    await docRef.delete();
    return {
      success: true,
      message: 'Write and delete successful.',
    };
  });
}

export async function testAuthToken(): Promise<TestResult> {
  return runTest(async () => {
    const adminAuth = getAdminAuth();
    const testUid = 'test-user-for-diagnostics';
    const token = await adminAuth.createCustomToken(testUid);
    return {
      success: true,
      message: 'Custom token created successfully.',
      token_preview: `${token.substring(0, 15)}...`,
    };
  });
}

export async function testMetadataServer(): Promise<TestResult> {
  return runTest(async () => {
    // This test now uses explicit credentials to prove auth is working,
    // rather than relying on the metadata server which isn't available.
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
        private_key: (process.env.SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse?.token) {
        throw new Error('Failed to retrieve access token using explicit credentials.');
    }

    return {
      success: true,
      message: "Successfully retrieved access token using service account credentials.",
      data: {
        projectId,
        token_type: tokenResponse.res?.data.token_type,
        token_preview: `${tokenResponse.token.substring(0, 15)}...`,
      },
    };
  });
}

const RoleSchema = z.enum(['patient', 'doctor', 'admin', 'super_admin']);

export async function setRoleForUser(uid: string, role: z.infer<typeof RoleSchema>): Promise<{success: boolean, message?: string, error?: string}> {
    if (!uid) {
        return { success: false, error: 'User ID cannot be empty.' };
    }
    const validatedRole = RoleSchema.safeParse(role);
    if (!validatedRole.success) {
        return { success: false, error: 'Invalid role specified.' };
    }

    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        
        // Step 1: Set the custom auth claim (most important for security rules)
        await adminAuth.setCustomUserClaims(uid, { role: validatedRole.data });

        // Step 2: Update the role in the Firestore document to keep data in sync
        const userDocRef = adminDb.collection('users').doc(uid);
        await userDocRef.update({ role: validatedRole.data });
        
        return { success: true, message: `Successfully set role to '${validatedRole.data}' for user ${uid}. Please have them sign out and back in.` };
    } catch (e: any) {
        console.error(`Failed to set role for user ${uid}:`, e);
        return { success: false, error: e.message || "An unknown error occurred." };
    }
}

export type DoctorOption = {
    id: string;
    name: string;
};

export async function getDoctorsForSelection(): Promise<DoctorOption[]> {
    try {
        const adminDb = getAdminDb();
        const doctorsSnapshot = await adminDb.collection('users').where('role', '==', 'doctor').get();
        if (doctorsSnapshot.empty) {
            return [];
        }
        return doctorsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
            };
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        return [];
    }
}

export async function getPatientCountForDoctor(doctorId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    if (!doctorId) {
        return { success: false, error: "Doctor ID is required." };
    }

    try {
        const adminDb = getAdminDb();
        const patientsQuery = adminDb.collection('users').where('doctorId', '==', doctorId);
        const snapshot = await patientsQuery.get();
        return { success: true, count: snapshot.size };
    } catch (e: any) {
        console.error("Error getting patient count:", e);
        return { success: false, error: e.message || "An unknown error occurred." };
    }
}
