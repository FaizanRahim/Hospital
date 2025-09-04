
'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { type DocumentData } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

export interface AdminStats {
    totalRevenue: number;
    weeklyRevenue: number;
    totalDoctors: number;
    totalPatients: number;
}

export interface TopDoctor extends DocumentData {
  id: string;
  name: string;
  email: string;
  patientCount: number;
  totalAssessments: number;
}

export interface AdminBillingData {
  stats: AdminStats;
  topDoctors: TopDoctor[];
}

export async function getAdminBillingData(): Promise<AdminBillingData> {
  const adminDb = getAdminDb();
  try {
    // --- CALCULATE STATS ---
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);

    // Get all invoices to calculate revenue
    const invoicesSnapshot = await adminDb.collection('invoices').get();
    let totalRevenue = 0;
    let weeklyRevenue = 0;
    invoicesSnapshot.forEach(doc => {
        const invoice = doc.data();
        totalRevenue += invoice.totalAmount || 0;
        if (invoice.date.toDate() >= oneWeekAgo) {
            weeklyRevenue += invoice.totalAmount || 0;
        }
    });

    // Get user counts
    const doctorsSnapshot = await adminDb.collection('users').where('role', '==', 'doctor').get();
    const patientsSnapshot = await adminDb.collection('users').where('role', '==', 'patient').get();
    const totalDoctors = doctorsSnapshot.size;
    const totalPatients = patientsSnapshot.size;

    const stats: AdminStats = {
        totalRevenue,
        weeklyRevenue,
        totalDoctors,
        totalPatients,
    };

    // --- GET TOP 5 DOCTORS BY PATIENT COUNT ---
    const doctorPatientCounts: { [doctorId: string]: number } = {};
    patientsSnapshot.forEach(doc => {
        const patient = doc.data();
        if (patient.doctorId) {
            doctorPatientCounts[patient.doctorId] = (doctorPatientCounts[patient.doctorId] || 0) + 1;
        }
    });

    const sortedDoctorIds = Object.keys(doctorPatientCounts).sort(
        (a, b) => doctorPatientCounts[b] - doctorPatientCounts[a]
    ).slice(0, 5);
    
    const topDoctors: TopDoctor[] = await Promise.all(sortedDoctorIds.map(async (doctorId) => {
      const doctorDoc = await adminDb.collection('users').doc(doctorId).get();
      const doctorData = doctorDoc.data() || {};
      
      const assessmentsSnapshot = await adminDb.collection('recommendation_requests').where('doctorId', '==', doctorId).get();

      return {
        id: doctorId,
        name: `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() || 'Unnamed Doctor',
        email: doctorData.email,
        patientCount: doctorPatientCounts[doctorId],
        totalAssessments: assessmentsSnapshot.size,
      };
    }));


    return {
      stats,
      topDoctors,
    };

  } catch (error) {
    console.error('Error fetching admin billing data:', error);
    // Return empty data on error to prevent crashing the page
    return {
      stats: {
        totalRevenue: 0,
        weeklyRevenue: 0,
        totalDoctors: 0,
        totalPatients: 0,
      },
      topDoctors: [],
    };
  }
}
