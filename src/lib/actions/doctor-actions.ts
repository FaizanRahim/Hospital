
'use server';

import { getAdminDb } from '@/lib/firebase/admin';

export interface DoctorDashboardStats {
    activePatients: number;
    pendingOrders: number;
    readyForReview: number;
}

export async function getDoctorDashboardStats(doctorId: string): Promise<DoctorDashboardStats> {
    if (!doctorId) {
        throw new Error('Doctor ID is required to fetch dashboard stats.');
    }

    const adminDb = getAdminDb();

    try {
        const patientsQuery = adminDb.collection('users')
            .where('role', '==', 'patient')
            .where('doctorId', '==', doctorId);
        
        const pendingOrdersQuery = adminDb.collection('users')
            .where('doctorId', '==', doctorId)
            .where('assessmentStatus', '==', 'pending');
        
        const readyForReviewQuery = adminDb.collection('assessments')
            .where('doctorId', '==', doctorId)
            .where('recommendationGenerated', '==', false)
            .where('phq9Score', '>=', 0); // Ensures we only count completed assessments


        const [
            patientsSnapshot,
            pendingOrdersSnapshot,
            readyForReviewSnapshot
        ] = await Promise.all([
            patientsQuery.get(),
            pendingOrdersQuery.get(),
            readyForReviewQuery.get()
        ]);
        
        return {
            activePatients: patientsSnapshot.size,
            pendingOrders: pendingOrdersSnapshot.size,
            readyForReview: readyForReviewSnapshot.size,
        };

    } catch (error) {
        console.error(`Error fetching dashboard stats for doctor ${doctorId}:`, error);
        // Return zeros on error to prevent the page from crashing.
        return {
            activePatients: 0,
            pendingOrders: 0,
            readyForReview: 0,
        };
    }
}
