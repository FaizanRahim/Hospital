
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';

export interface Resource extends DocumentData {
    id: string;
    title: string;
    description: string;
    url: string;
    category: 'Crisis' | 'Coping' | 'Therapy' | 'Education' | 'Other';
    doctorId: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
}


const ResourceSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  url: z.string().url('Please enter a valid URL.'),
  category: z.enum(['Crisis', 'Coping', 'Therapy', 'Education', 'Other']),
});

const AddResourceSchema = ResourceSchema.extend({
  doctorId: z.string().min(1),
});

export type ResourceActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
};

export async function addResource(
  prevState: ResourceActionState,
  formData: FormData
): Promise<ResourceActionState> {
  const validatedFields = AddResourceSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    return {
      status: 'error',
      error: Object.values(error).flat().join(', ') || 'Invalid data provided.',
    };
  }

  const { title, description, url, category, doctorId } = validatedFields.data;
  const adminDb = getAdminDb();

  try {
    await adminDb.collection('resources').add({
      title,
      description,
      url,
      category,
      doctorId,
      createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/dashboard/manage-resources');
    return { status: 'success', message: 'Resource added successfully!' };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to add resource: ${errorMessage}`,
    };
  }
}

export async function updateResource(
  prevState: ResourceActionState,
  formData: FormData
): Promise<ResourceActionState> {
  const resourceId = formData.get('resourceId') as string;
  if (!resourceId) {
    return { status: 'error', error: 'Resource ID is missing.' };
  }

  const validatedFields = ResourceSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    return {
      status: 'error',
      error: Object.values(error).flat().join(', ') || 'Invalid data provided.',
    };
  }

  const adminDb = getAdminDb();
  try {
    const resourceRef = adminDb.collection('resources').doc(resourceId);
    await resourceRef.update({
      ...validatedFields.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/dashboard/manage-resources');
    return { status: 'success', message: 'Resource updated successfully!' };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to update resource: ${errorMessage}`,
    };
  }
}

export async function deleteResource(
  prevState: ResourceActionState,
  formData: FormData
): Promise<ResourceActionState> {
  const resourceId = formData.get('resourceId') as string;
  if (!resourceId) {
    return { status: 'error', error: 'Resource ID is missing.' };
  }
  
  const adminDb = getAdminDb();
  try {
    await adminDb.collection('resources').doc(resourceId).delete();
    revalidatePath('/dashboard/manage-resources');
    return { status: 'success', message: 'Resource deleted successfully!' };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to delete resource: ${errorMessage}`,
    };
  }
}

export async function getResourcesByDoctor(doctorId: string): Promise<Resource[]> {
    const adminDb = getAdminDb();
    try {
        const query = adminDb.collection('resources')
            .where('doctorId', '==', doctorId)
            .orderBy('createdAt', 'desc');

        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resource[];
    } catch (error) {
        console.error("Error fetching resources by doctor:", error);
        return [];
    }
}


export async function getResourcesForPatient(patientId: string): Promise<Resource[]> {
    const adminDb = getAdminDb();
    try {
        const patientDoc = await adminDb.collection('users').doc(patientId).get();
        if (!patientDoc.exists) {
            console.log(`No patient found with ID: ${patientId}`);
            return [];
        }
        
        const doctorId = patientDoc.data()?.doctorId;
        if (!doctorId) {
            console.log(`Patient ${patientId} is not linked to a doctor.`);
            return [];
        }
        
        return await getResourcesByDoctor(doctorId);
        
    } catch (error) {
        console.error(`Error fetching resources for patient ${patientId}:`, error);
        return [];
    }
}
