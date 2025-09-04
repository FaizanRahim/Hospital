
'use server';

import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/admin';

const CloverSettingsSchema = z.object({
  settingsId: z.string().min(1, 'Settings ID is required.'),
  cloverApiKey: z.string().min(1, 'Clover API Key is required.'),
  cloverApiSecret: z.string().min(1, 'Clover API Secret is required.'),
});

export type CloverSettingsActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
};

export async function saveCloverSettings(
  prevState: CloverSettingsActionState,
  formData: FormData
): Promise<CloverSettingsActionState> {
  const validatedFields = CloverSettingsSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      status: 'error',
      error: 'API Key and Secret are both required.',
    };
  }

  const { settingsId, cloverApiKey, cloverApiSecret } = validatedFields.data;
  
  // In a real application, these keys should be encrypted and stored in a
  // secure way, like Google Secret Manager, not in Firestore.
  // For this prototype, we'll just simulate success without storing them.
  console.log(`Simulating save for settingsId: ${settingsId}`);
  console.log(`Clover API Key (first 4): ${cloverApiKey.substring(0,4)}...`);
  console.log(`Clover API Secret (first 4): ${cloverApiSecret.substring(0,4)}...`);
  
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const adminDb = getAdminDb();
  try {
    // We store platform-wide settings in a specific collection/document
    await adminDb.collection('platform_settings').doc(settingsId).set({
        paymentGateway: 'Clover',
        paymentGatewayConfigured: true,
        // In a real app, DO NOT store secrets in Firestore. Use a secret manager.
        // The line below is for demonstration only and is highly insecure.
        _insecure_cloverApiKey: cloverApiKey, 
        _insecure_cloverApiSecret: cloverApiSecret,
    }, { merge: true });

    return { status: 'success', message: 'Clover settings saved successfully!' };

  } catch (e) {
     const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
     return {
      status: 'error',
      error: `Failed to save settings: ${errorMessage}`,
    };
  }
}
