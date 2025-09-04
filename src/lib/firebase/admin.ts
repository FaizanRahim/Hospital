
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  
  // In a managed Google Cloud environment, the SDK can discover credentials.
  // However, explicitly providing them from environment variables is more robust.
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    // The private key needs to have its newlines properly formatted.
    privateKey: (process.env.SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.privateKey || !serviceAccount.clientEmail) {
    console.warn("Service account credentials are not fully set. Server-side Firebase features may fail.");
    // Initialize without credentials, relying on auto-discovery as a fallback.
    return admin.initializeApp();
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function getAdminAuth(): Auth {
    return getFirebaseAdminApp().auth();
}

function getAdminDb(): Firestore {
    return getFirebaseAdminApp().firestore();
}

function getAdminStorage(): Storage {
    const app = getFirebaseAdminApp();
    if (!app.options.storageBucket) {
        throw new Error('Firebase Storage bucket is not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your environment variables.');
    }
    return app.storage();
}

export { getAdminDb, getAdminAuth, getAdminStorage, admin };
