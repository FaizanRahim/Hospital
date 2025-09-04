
'use server';

import { z } from 'zod';
import { getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

const PlatformLogoSchema = z.object({
  logo: z
    .instanceof(File, { message: 'A logo file is required.' })
    .refine((file) => file.size > 0, 'Logo file cannot be empty.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .png, .svg, and .webp formats are supported.'
    ),
});

export type PlatformSettingsActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
  logoUrl?: string;
};

export async function savePlatformLogo(
  prevState: PlatformSettingsActionState,
  formData: FormData
): Promise<PlatformSettingsActionState> {
  const validatedFields = PlatformLogoSchema.safeParse({
    logo: formData.get('logo'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors.logo?.[0];
    return {
      status: 'error',
      error: error || 'Invalid file provided.',
    };
  }

  const { logo } = validatedFields.data;

  try {
    const adminStorage = getAdminStorage();
    const adminDb = getAdminDb();
    
    const bucket = adminStorage.bucket(); // Default bucket
    const filePath = `platform_branding/logo-${Date.now()}.${logo.name.split('.').pop()}`;
    const fileBuffer = Buffer.from(await logo.arrayBuffer());

    const file = bucket.file(filePath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: logo.type,
      },
    });

    // Make the file public and get its URL
    await file.makePublic();
    const publicUrl = file.publicUrl();

    // Save the URL to Firestore
    await adminDb.collection('platform_settings').doc('branding').set({
      logoUrl: publicUrl,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    revalidatePath('/', 'layout'); // Revalidate the entire site to update the header

    return {
      status: 'success',
      message: 'Logo updated successfully!',
      logoUrl: publicUrl,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to upload logo: ${errorMessage}`,
    };
  }
}

export async function getPlatformLogo(): Promise<string | null> {
    const adminDb = getAdminDb();
    try {
        const doc = await adminDb.collection('platform_settings').doc('branding').get();
        if (doc.exists) {
            return doc.data()?.logoUrl || null;
        }
        return "https://ourwellnesslife.com/wp-content/uploads/2023/06/owl-logo-w.png";
    } catch (error) {
        console.error("Error fetching platform logo, returning default:", error);
        return "https://ourwellnesslife.com/wp-content/uploads/2023/06/owl-logo-w.png";
    }
}
