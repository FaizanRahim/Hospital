
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { type Assessment } from '@/lib/firebase/firestore-types';
import { sendEmail } from '@/lib/email';

const UserProfileSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required.'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required.'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required.'),
  hipaaConsent: z.string().refine(val => val === 'on', {
    message: 'You must consent to the HIPAA policy.',
  }),
  source: z.string().optional(), // to track where the update is coming from
});

export type UpdateProfileActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
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


export async function updateUserProfile(
  prevState: UpdateProfileActionState,
  formData: FormData
): Promise<UpdateProfileActionState> {
  const validatedFields = UserProfileSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      status: 'error',
      error: validatedFields.error.flatten().fieldErrors.hipaaConsent?.[0] || 'Invalid data provided.',
    };
  }
  
  const { userId, source, ...profileData } = validatedFields.data;
  const adminDb = getAdminDb();

  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    
    // For HIPAA logging, fetch the current state of the document before updating.
    const beforeSnapshot = await userDocRef.get();
    const beforeData = beforeSnapshot.data() || {};

    const dataToUpdate: DocumentData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        emergencyContactName: profileData.emergencyContactName,
        emergencyContactPhone: profileData.emergencyContactPhone,
        hipaaConsent: true,
        profileComplete: true,
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (profileData.dateOfBirth) {
        dataToUpdate.dateOfBirth = new Date(profileData.dateOfBirth);
    } else {
        dataToUpdate.dateOfBirth = null;
    }


    await userDocRef.set(dataToUpdate, { merge: true });
    
    const changes: Record<string, { before: any, after: any }> = {};
    Object.keys(dataToUpdate).forEach(key => {
        const beforeValue = beforeData[key];
        const afterValue = dataToUpdate[key];
        // Simple check for value changes. More complex logic might be needed for deep objects.
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
            changes[key] = {
                before: beforeValue instanceof Date ? beforeValue.toISOString() : beforeValue ?? null,
                after: afterValue instanceof Date ? afterValue.toISOString() : afterValue ?? null
            };
        }
    });

    if (Object.keys(changes).length > 0) {
        const actor = await getActor(userId); // The user is the actor of their own profile update
        await adminDb.collection('audit_logs').add({
            actorId: userId,
            actorEmail: actor.email,
            action: 'UPDATE_USER_PROFILE',
            targetType: 'user',
            targetId: userId,
            details: { changes },
            timestamp: FieldValue.serverTimestamp(),
        });
    }

    if (source !== 'kiosk') {
        revalidatePath('/dashboard', 'layout');
    }

    return { status: 'success', message: 'Profile updated successfully!' };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to update profile: ${errorMessage}`,
    };
  }
}

export async function createUserProfile(userId: string, email: string, role: 'patient' | 'doctor' | 'admin' | 'super_admin', initialData: Record<string, any> = {}) {
    let finalRole: 'patient' | 'doctor' | 'super_admin' | 'admin' = role;
    if (email.toLowerCase() === 'admin@example.com') {
        finalRole = 'super_admin';
    }

    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();

    try {
        // Ensure all data is defined before setting
        const profileData: DocumentData = {
            email: email,
            role: finalRole,
            createdAt: FieldValue.serverTimestamp(),
            profileComplete: initialData.profileComplete || false, 
            firstName: initialData.firstName || null,
            lastName: initialData.lastName || null,
            practiceName: initialData.practiceName || null,
            practiceWebsite: initialData.practiceWebsite || null,
            phone: initialData.phone || null,
            hipaaConsent: initialData.hipaaConsent || false,
            lastPhq9Score: initialData.lastPhq9Score || null,
            lastGad7Score: initialData.lastGad7Score || null,
        };

        // Add doctorId if it exists in initialData
        if (initialData.doctorId) {
            profileData.doctorId = initialData.doctorId;
        }

        // Add assessment status fields if they exist
        if (initialData.assessmentStatus) {
            profileData.assessmentStatus = initialData.assessmentStatus;
            profileData.assessmentSentAt = initialData.assessmentSentAt;
        }


        await adminDb.collection('users').doc(userId).set(profileData);
        // This is the critical step to set the custom claim on the Auth user
        await adminAuth.setCustomUserClaims(userId, { role: finalRole });

    } catch (error) {
        console.error(`FAILED to create user profile for userId: ${userId}. Error:`, error);
        throw error; // Re-throw the error to be caught by the caller
    }
}


export type CreatePatientActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
  patientId?: string;
}

const CreatePatientSchema = z.object({
  doctorId: z.string().min(1),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  patientEmail: z.string().email('Invalid email address.'),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  source: z.string().optional(),
});


export async function createPatientByDoctor(prevState: CreatePatientActionState, formData: FormData): Promise<CreatePatientActionState> {
  const validatedFields = CreatePatientSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      status: 'error',
      error: 'Invalid data provided.',
    };
  }
  
  const { doctorId, patientEmail, source, ...profileData } = validatedFields.data;
  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth();
  
  try {
    let existingUser;
    try {
        existingUser = await adminAuth.getUserByEmail(patientEmail);
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw unexpected auth errors
        }
        // User does not exist, so we will create them.
    }
    
    const assessmentData = {
        assessmentStatus: 'pending',
        assessmentSentAt: FieldValue.serverTimestamp(),
    };
    
    const fullProfileData: DocumentData = {
        ...profileData,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
        phone: profileData.phone || null,
        emergencyContactName: profileData.emergencyContactName || null,
        emergencyContactPhone: profileData.emergencyContactPhone || null,
        profileComplete: source === 'kiosk',
    };

    // Scenario 1: The user already exists in Firebase Auth.
    if (existingUser) {
        const userDocRef = adminDb.collection('users').doc(existingUser.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists || userDoc.data()?.role !== 'patient') {
             return { status: 'error', error: 'A user with this email already exists but is not a patient.' };
        }
        
        const patientData = userDoc.data();
        if (patientData?.doctorId && patientData.doctorId !== doctorId) {
            return { status: 'error', error: 'This patient is already linked to a different doctor.' };
        }

        // Link the existing patient and send assessment
        // Use set with merge: true to ensure all fields are added or updated correctly.
        await userDocRef.set({ 
            doctorId,
            ...fullProfileData,
            ...assessmentData,
        }, { merge: true });
        
        revalidatePath('/dashboard/my-patients');
        revalidatePath('/dashboard/assessment-orders');
        revalidatePath('/dashboard');
        return { status: 'success', message: `Successfully linked to existing patient: ${patientEmail}`, patientId: existingUser.uid };
    }
    
    // Scenario 2: The user does not exist. Create them from scratch.
    const newPatient = await adminAuth.createUser({ 
        email: patientEmail,
        displayName: `${profileData.firstName} ${profileData.lastName}`,
        // In a real app, you'd send a password reset or setup link, not use a hardcoded password.
        password: 'password123', 
    });

    await createUserProfile(newPatient.uid, patientEmail, 'patient', {
      doctorId,
      ...fullProfileData,
      ...assessmentData,
    });
    
    revalidatePath('/dashboard/my-patients');
    revalidatePath('/dashboard/assessment-orders');
    revalidatePath('/dashboard');
    return { status: 'success', message: `Successfully created and linked new patient: ${patientEmail}`, patientId: newPatient.uid };

  } catch (e: any)
{
    const errorMessage = e.code === 'auth/email-already-exists'
      ? 'A user with this email already exists.'
      : e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to add or link patient: ${errorMessage}`,
    };
  }
}


export type SendAssessmentActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
}

const SendAssessmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  patientEmail: z.string().email(),
});

export async function sendAssessmentToPatient(prevState: SendAssessmentActionState, formData: FormData): Promise<SendAssessmentActionState> {
  const validatedFields = SendAssessmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      return { status: 'error', error: 'Invalid data provided.' };
  }
  
  const { patientId, doctorId, patientEmail } = validatedFields.data;
  const adminDb = getAdminDb();
  
  try {
    const patientRef = adminDb.collection('users').doc(patientId);
    await patientRef.update({
      assessmentStatus: 'pending',
      assessmentSentAt: FieldValue.serverTimestamp(),
    });

    const actor = await getActor(doctorId);
    await adminDb.collection('audit_logs').add({
      actorId: doctorId,
      actorEmail: actor.email || 'N/A',
      action: 'SEND_ASSESSMENT',
      targetType: 'user',
      targetId: patientId,
      details: {
        patientEmail: patientEmail,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    // Send the actual email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await sendEmail({
      to: patientEmail,
      subject: 'New Mental Health Assessment from Your Doctor',
      html: `
        <p>Hello,</p>
        <p>Your doctor has sent you a new mental health assessment (PHQ-9 & GAD-7).</p>
        <p>Please log in to your account to complete it at your earliest convenience.</p>
        <p><a href="${appUrl}/dashboard">Click here to go to your dashboard</a></p>
        <p>Thank you,</p>
        <p>The Mindful Assessment Platform Team</p>
      `,
    });


    revalidatePath('/dashboard/my-patients');
    revalidatePath('/dashboard/assessment-orders');
    return { status: 'success', message: 'Assessment sent successfully.' };

  } catch (e: any) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { status: 'error', error: `Failed to send assessment: ${errorMessage}` };
  }
}

export async function resendInviteToPatient(prevState: SendAssessmentActionState, formData: FormData): Promise<SendAssessmentActionState> {
  const validatedFields = SendAssessmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      return { status: 'error', error: 'Invalid data provided.' };
  }
  
  const { patientId, doctorId, patientEmail } = validatedFields.data;
  const adminDb = getAdminDb();
  
  try {
    const actor = await getActor(doctorId);
    await adminDb.collection('audit_logs').add({
      actorId: doctorId,
      actorEmail: actor.email || 'N/A',
      action: 'RESEND_INVITE',
      targetType: 'user',
      targetId: patientId,
      details: {
        patientEmail: patientEmail,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    // Send the actual email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await sendEmail({
      to: patientEmail,
      subject: 'Reminder: Complete Your Mental Health Assessment',
      html: `
        <p>Hello,</p>
        <p>This is a reminder from your doctor to complete your mental health assessment (PHQ-9 & GAD-7).</p>
        <p>Please log in to your account to complete it at your earliest convenience.</p>
        <p><a href="${appUrl}/dashboard">Click here to go to your dashboard</a></p>
        <p>Thank you,</p>
        <p>The Mindful Assessment Platform Team</p>
      `,
    });

    return { status: 'success', message: 'Invite reminder sent successfully.' };

  } catch (e: any) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { status: 'error', error: `Failed to resend invite: ${errorMessage}` };
  }
}


export type LinkDoctorActionState = {
  status: 'idle' | 'success' | 'error';
  error?: string;
  message?: string;
}

const LinkDoctorSchema = z.object({
  patientId: z.string().min(1),
  doctorEmail: z.string().email(),
});

export async function linkDoctor(prevState: LinkDoctorActionState, formData: FormData): Promise<LinkDoctorActionState> {
    const validatedFields = LinkDoctorSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { status: 'error', error: 'Invalid data.' };
    }

    const { patientId, doctorEmail } = validatedFields.data;
    const adminDb = getAdminDb();

    try {
        const doctorQuery = adminDb.collection('users').where('email', '==', doctorEmail).where('role', '==', 'doctor');
        const doctorSnapshot = await doctorQuery.get();

        if (doctorSnapshot.empty) {
            return { status: 'error', error: 'No doctor found with that email address.' };
        }

        const doctorId = doctorSnapshot.docs[0].id;
        const patientRef = adminDb.collection('users').doc(patientId);

        await patientRef.update({
            doctorId: doctorId,
            assessmentStatus: 'pending',
            assessmentSentAt: FieldValue.serverTimestamp(),
        });

        revalidatePath('/dashboard/profile');
        revalidatePath('/dashboard/assessment-orders');
        return { status: 'success', message: 'Successfully linked to your doctor! An assessment has been sent.' };

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { status: 'error', error: `Failed to link doctor: ${errorMessage}` };
    }
}


const logSchema = z.object({
  doctorId: z.string().min(1),
  patientId: z.string().min(1),
});

export async function logViewedPatientHistory(formData: FormData) {
  const validatedFields = logSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    console.error("Invalid data for logging:", validatedFields.error);
    return;
  }
  
  const { doctorId, patientId } = validatedFields.data;
  // Safeguard against empty strings
  if (!doctorId || !patientId) {
      console.error("DoctorID or PatientID is missing for audit log.");
      return;
  }

  const adminDb = getAdminDb();

  try {
     const actor = await getActor(doctorId);
     await adminDb.collection('audit_logs').add({
      actorId: doctorId,
      actorEmail: actor.email || 'N/A',
      action: 'VIEW_PATIENT_HISTORY',
      targetType: 'user',
      targetId: patientId,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch(e) {
    console.error("Failed to write to audit log:", e);
  }
}


export type UpdateUserRoleActionState = {
    status: 'idle' | 'success' | 'error';
    error?: string;
};

const UpdateUserRoleSchema = z.object({
    userId: z.string().min(1),
    newRole: z.enum(['patient', 'doctor', 'admin', 'super_admin']),
});

export async function updateUserRole(
    prevState: UpdateUserRoleActionState,
    formData: FormData
): Promise<UpdateUserRoleActionState> {
    const validatedFields = UpdateUserRoleSchema.safeParse(
        Object.fromEntries(formData.entries())
    );
    if (!validatedFields.success) {
        return { status: 'error', error: 'Invalid data.' };
    }
    const { userId, newRole } = validatedFields.data;
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    try {
        await adminAuth.setCustomUserClaims(userId, { role: newRole });
        const userDocRef = adminDb.collection('users').doc(userId);
        await userDocRef.update({ role: newRole });
        revalidatePath('/dashboard/admin');
        return { status: 'success' };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { status: 'error', error: `Failed to update role: ${errorMessage}` };
    }
}

export async function getDoctorProfileById(doctorId: string): Promise<{
    firstName?: string;
    lastName?: string;
    email?: string;
} | null> {
    if (!doctorId) return null;
    try {
        const adminDb = getAdminDb();
        const doctorDoc = await adminDb.collection('users').doc(doctorId).get();
        if (doctorDoc.exists) {
            const data = doctorDoc.data();
            return {
                firstName: data?.firstName,
                lastName: data?.lastName,
                email: data?.email,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching doctor profile by ID:", error);
        return null; // Return null on error to avoid crashing the client
    }
}


// New server action to securely fetch patient details for a doctor
export async function getPatientDetailsForDoctor(
  patientId: string,
  doctorId: string
): Promise<{
  patientProfile: (DocumentData & { dateOfBirth?: string }) | null;
  assessments: Assessment[];
  error?: string;
}> {
  const adminDb = getAdminDb();
  try {
    // 1. Fetch patient profile and verify ownership
    const patientDoc = await adminDb.collection('users').doc(patientId).get();

    if (!patientDoc.exists || patientDoc.data()?.doctorId !== doctorId) {
      return {
        patientProfile: null,
        assessments: [],
        error: 'Patient not found or you do not have permission to view this profile.',
      };
    }
    const patientProfileData = patientDoc.data()!;
    // Serialize date so it's safe to pass from server to client component
    if (patientProfileData.dateOfBirth && typeof patientProfileData.dateOfBirth.toDate === 'function') {
      patientProfileData.dateOfBirth = patientProfileData.dateOfBirth.toDate().toISOString();
    }


    // 2. Fetch assessments for the patient
    const q = adminDb.collection('assessments').where('userId', '==', patientId);
    const querySnapshot = await q.get();

    const assessmentsData: Assessment[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Assessment;
      })
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

    return {
      patientProfile: patientProfileData,
      assessments: assessmentsData,
    };
  } catch (err: any) {
    console.error('Error in getPatientDetailsForDoctor:', err);
    return {
      patientProfile: null,
      assessments: [],
      error: 'An unexpected error occurred while fetching patient data.',
    };
  }
}

export type DeletePatientActionState = {
    status: 'idle' | 'success' | 'error';
    error?: string;
    message?: string;
};

const DeletePatientSchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required.'),
    actorId: z.string().min(1, 'Actor ID is required.'),
});

export async function deletePatient(
    prevState: DeletePatientActionState,
    formData: FormData
): Promise<DeletePatientActionState> {
    const validatedFields = DeletePatientSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { status: 'error', error: 'Invalid data provided for deletion.' };
    }

    const { patientId, actorId } = validatedFields.data;
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();

    try {
        const patientDocRef = adminDb.collection('users').doc(patientId);
        const patientDoc = await patientDocRef.get();

        if (!patientDoc.exists) {
            return { status: 'error', error: 'Patient not found.' };
        }

        const patientData = patientDoc.data()!;

        // For audit logging, ensure we have the actor's details
        const actor = await getActor(actorId);

        // Delete from Firestore
        await patientDocRef.delete();

        // Delete from Firebase Authentication
        await adminAuth.deleteUser(patientId);
        
        await adminDb.collection('audit_logs').add({
            actorId: actorId,
            actorEmail: actor.email,
            action: 'DELETE_PATIENT',
            targetType: 'user',
            targetId: patientId,
            details: {
                deletedPatientEmail: patientData.email,
                deletedPatientName: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim(),
            },
            timestamp: FieldValue.serverTimestamp(),
        });

        revalidatePath('/dashboard/my-patients');

        return { status: 'success', message: 'Patient has been permanently deleted.' };
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        console.error(`Failed to delete patient ${patientId}:`, e);
        return { status: 'error', error: `Failed to delete patient: ${errorMessage}` };
    }
}
