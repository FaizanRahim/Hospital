
import { getAdminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import type { UserRecord } from 'firebase-admin/auth';

// This function gets the currently logged in user from the server context.
// It uses the token stored in cookies to verify the user's identity.
export async function getCurrentUser(): Promise<UserRecord | null> {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
        return null;
    }

    try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const user = await getAdminAuth().getUser(decodedToken.uid);
        return user;
    } catch (error) {
        console.error("Error verifying auth token:", error);
        return null;
    }
}
