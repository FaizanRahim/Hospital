
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { allResources } from './static-recommendations';

// Define the shape of the output for consistency with the UI components
export type ResourceRecommendationsOutput = {
  resources: Array<{
    title: string;
    description: string;
    url: string;
    category: 'Crisis' | 'Coping' | 'Therapy';
  }>;
};

const FormSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required.' }),
  doctorId: z.string().optional(), // doctorId is optional as a patient might not be linked yet
  phq9Score: z.coerce
    .number()
    .min(0, 'Score must be at least 0')
    .max(27, 'Score cannot exceed 27'),
  gad7Score: z.coerce
    .number()
    .min(0, 'Score must be at least 0')
    .max(21, 'Score cannot exceed 21'),
  additionalContext: z
    .string()
    .max(500, 'Context cannot exceed 500 characters.')
    .optional(),
});

export type ActionState = {
  data?: ResourceRecommendationsOutput;
  error?: string;
  status: 'idle' | 'success' | 'error';
};

async function getActor(actorId: string): Promise<{email?: string}> {
    if (!actorId) return {};
    try {
        const adminAuth = getAdminAuth();
        const actorRecord = await adminAuth.getUser(actorId);
        return { email: actorRecord.email };
    } catch (error) {
        console.warn(`Could not retrieve actor ${actorId}`, error);
        return { email: 'Unknown User' };
    }
}


// New action for the guided assessment flow
export async function submitAndGetRecommendations(
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());
  
  const phq9Answers: { [key: string]: number } = {};
  const gad7Answers: { [key: string]: number } = {};

  for (const key in rawData) {
      if (key.startsWith('phq9_')) {
          phq9Answers[key] = Number(rawData[key]);
      } else if (key.startsWith('gad7_')) {
          gad7Answers[key] = Number(rawData[key]);
      }
  }

  const phq9Score = Object.values(phq9Answers).reduce((sum, val) => sum + val, 0);
  const gad7Score = Object.values(gad7Answers).reduce((sum, val) => sum + val, 0);

  const validatedFields = FormSchema.safeParse({
    userId: rawData.userId,
    doctorId: rawData.doctorId,
    phq9Score,
    gad7Score,
    additionalContext: rawData.additionalContext,
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      error: 'Invalid data submitted. Please complete the assessment.',
    };
  }

  const { userId, doctorId, additionalContext } = validatedFields.data;
  const adminDb = getAdminDb();

  try {
    const userRef = adminDb.collection('users').doc(userId);
    // --- Hardcoded Recommendation Logic ---
    const recommendations: ResourceRecommendationsOutput = { resources: [] };
    if (phq9Score >= 20 || gad7Score >= 15) {
        recommendations.resources.push(...allResources.crisis);
    }
    if ((phq9Score >= 10 && phq9Score < 20) || (gad7Score >= 10 && gad7Score < 15)) {
        recommendations.resources.push(...allResources.coping);
    }
    recommendations.resources.push(...allResources.therapy);
    // --- End Hardcoded Logic ---

    // Write the full submission, scores, and recommendations to Firestore
    const newAssessmentRef = await adminDb.collection('assessments').add({
      userId,
      doctorId, // Denormalize doctorId for easier querying
      phq9Score,
      gad7Score,
      additionalContext,
      answers: {
        phq9: phq9Answers,
        gad7: gad7Answers,
      },
      recommendations: recommendations.resources || [],
      recommendationGenerated: false, // Flag for doctor's queue
      createdAt: FieldValue.serverTimestamp(),
    });

    // Denormalize latest assessment data onto the user's profile for quick access
    await userRef.update({
      lastAssessmentAt: FieldValue.serverTimestamp(),
      lastPhq9Score: phq9Score,
      lastGad7Score: gad7Score,
      assessmentStatus: 'completed',
    });

    // Create notification for the doctor
    if (doctorId) {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            // This should not happen if the previous update succeeded, but as a safeguard.
            return { status: 'error', error: 'User not found.' };
        }
        const userData = userDoc.data()!;
        const patientName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email;

        let message = `${patientName} has completed their assessment.`;
        if (phq9Score >= 15 || gad7Score >= 15) {
            message = `${patientName} has completed an assessment that requires your review.`;
        }
        await adminDb.collection('notifications').add({
            doctorId,
            patientId: userId,
            message,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        const actor = await getActor(userId); // Patient is actor
        await adminDb.collection('audit_logs').add({
          actorId: userId,
          actorEmail: actor.email || 'N/A',
          action: 'ASSESSMENT_COMPLETED',
          targetType: 'user',
          targetId: userId,
          details: {
            phq9Score,
            gad7Score,
            assessmentId: newAssessmentRef.id,
          },
          timestamp: FieldValue.serverTimestamp(),
        });
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/patient/${userId}`);
    revalidatePath('/dashboard/my-patients');
    revalidatePath('/dashboard/ready-for-review');
    revalidatePath('/dashboard/assessment-orders');

    return { status: 'success', data: recommendations };
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Action failed: ${errorMessage}`,
    };
  }
}


const NoteSchema = z.object({
  assessmentId: z.string().min(1),
  note: z.string().max(1000, "Note cannot exceed 1000 characters.").default(""),
});

export type NoteActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
}

export async function addOrUpdateDoctorNote(
  prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const validatedFields = NoteSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      status: 'error',
      error: 'Invalid data provided.',
    };
  }

  const { assessmentId, note } = validatedFields.data;
  const adminDb = getAdminDb();

  try {
    const assessmentRef = adminDb.collection('assessments').doc(assessmentId);
    const assessmentDoc = await assessmentRef.get();
    if (!assessmentDoc.exists) {
        return { status: 'error', error: 'Assessment not found.' };
    }
    const assessmentData = assessmentDoc.data()!;

    await assessmentRef.update({
      doctorNote: note,
      recommendationGenerated: true, // This marks the assessment as "reviewed"
    });
    
    // HIPAA Compliance: Log this action
    const actor = await getActor(assessmentData.doctorId);
    await adminDb.collection('audit_logs').add({
        actorId: assessmentData.doctorId,
        actorEmail: actor.email || 'N/A',
        action: 'ADD_DOCTOR_NOTE',
        targetType: 'assessment',
        targetId: assessmentId,
        details: {
            note,
            patientId: assessmentData.userId,
        },
        timestamp: FieldValue.serverTimestamp(),
    });


    revalidatePath('/dashboard', 'layout');
    return { status: 'success' };
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to save note: ${errorMessage}`,
    };
  }
}

export type EmailActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
};

const EmailSchema = z.object({
  assessmentId: z.string().min(1),
});

export async function emailAssessmentResults(
  prevState: EmailActionState,
  formData: FormData
): Promise<EmailActionState> {
  const validatedFields = EmailSchema.safeParse({
    assessmentId: formData.get('assessmentId'),
  });

  if (!validatedFields.success) {
    return { status: 'error', error: 'Invalid assessment ID.' };
  }
  
  const { assessmentId } = validatedFields.data;
  const adminDb = getAdminDb();

  try {
    const assessmentDocRef = adminDb.collection('assessments').doc(assessmentId);
    const assessmentDoc = await assessmentDocRef.get();

    if (!assessmentDoc.exists) {
      return { status: 'error', error: 'Assessment not found.' };
    }

    const assessmentData = assessmentDoc.data()!;
    const userId = assessmentData.userId;
    
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
         return { status: 'error', error: 'User not found.' };
    }
    
    const userEmail = userDoc.data()!.email;

    // In a real application, you would integrate with an email sending service here.
    // For this demo, we will just log to the console.
    console.log(`SIMULATING EMAIL: Sending results for assessment ${assessmentId} to ${userEmail}.`);
    console.log('Assessment Data:', assessmentData);
    
    const actor = await getActor(userId);
    await adminDb.collection('audit_logs').add({
      actorId: userId,
      actorEmail: actor.email || 'N/A',
      action: 'EMAIL_RESULTS_TO_SELF',
      targetType: 'user',
      targetId: userId,
      details: {
        assessmentId: assessmentId,
        sentTo: userEmail,
      },
      timestamp: FieldValue.serverTimestamp(),
    });
        
    return { status: 'success' };
    
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    console.error("Email sending failed:", errorMessage);
    return { status: 'error', error: `Failed to send email: ${errorMessage}` };
  }
}
