
'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { type DocumentData, FieldPath } from 'firebase-admin/firestore';

export interface Doctor {
  id: string;
  name: string;
}

export interface Invoice extends DocumentData {
  id: string;
  invoiceId: string;
  paymentStatus: 'Paid' | 'Pending';
  totalAmount: number;
  paymentMethod: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  doctorId: string;
  doctorName?: string;
}

export interface BillingData {
  invoices: Invoice[];
  stats: {
    currentPlan: string;
    assessmentsUsed: number;
    assessmentsLimit: number;
    nextInvoiceAmount: number;
    renewalDate: Date;
    nextInvoiceDate: Date;
    paymentMethod: string;
    paymentMethodExpires: string;
  };
  doctors?: Doctor[];
}

const PLAN_DETAILS = {
  name: "Pro Tier",
  basePrice: 29.00,
  includedAssessments: 100,
  perAssessmentOverage: 2.00,
};

export async function getBillingData(userId: string, adminView: boolean = false): Promise<BillingData> {
  const adminDb = getAdminDb();
  try {
    let invoicesQuery;

    if (adminView) {
      invoicesQuery = adminDb.collection('invoices').orderBy('date', 'desc');
    } else {
      invoicesQuery = adminDb.collection('invoices').where('doctorId', '==', userId).orderBy('date', 'desc');
    }

    const invoicesSnapshot = await invoicesQuery.get();
    
    const doctorNames: Map<string, string> = new Map();
    if (adminView) {
        const doctorIds = new Set(invoicesSnapshot.docs.map(doc => doc.data().doctorId).filter(Boolean));
        if (doctorIds.size > 0) {
            const doctorsSnapshot = await adminDb.collection('users').where(FieldPath.documentId(), 'in', Array.from(doctorIds)).get();
            doctorsSnapshot.forEach(doc => {
                const data = doc.data();
                const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email;
                doctorNames.set(doc.id, name);
            });
        }
    }

    const invoices = invoicesSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Invoice, 'id' | 'doctorName'>;
        return {
            id: doc.id,
            ...data,
            doctorName: doctorNames.get(data.doctorId) || 'N/A',
        } as Invoice;
    });

    let doctors: Doctor[] | undefined;
    if (adminView) {
        const doctorsSnapshot = await adminDb.collection('users').where('role', '==', 'doctor').get();
        doctors = doctorsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          };
        });
    }

    if (adminView) {
        return {
          invoices,
          stats: { /* Omitted for admin */ } as any,
          doctors,
        };
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const assessmentsQuery = adminDb
      .collection('assessments')
      .where('doctorId', '==', userId)
      .where('createdAt', '>=', startOfCurrentMonth)
      .where('createdAt', '<=', endOfCurrentMonth);

    const assessmentsSnapshot = await assessmentsQuery.get();
    const assessmentsUsed = assessmentsSnapshot.size;

    const overageCount = Math.max(0, assessmentsUsed - PLAN_DETAILS.includedAssessments);
    const overageCost = overageCount * PLAN_DETAILS.perAssessmentOverage;
    const nextInvoiceAmount = PLAN_DETAILS.basePrice + overageCost;

    const stats = {
        currentPlan: PLAN_DETAILS.name,
        assessmentsUsed: assessmentsUsed,
        assessmentsLimit: PLAN_DETAILS.includedAssessments,
        nextInvoiceAmount: nextInvoiceAmount,
        renewalDate: endOfCurrentMonth,
        nextInvoiceDate: addMonths(endOfCurrentMonth, 1),
        paymentMethod: "Visa **** 4242",
        paymentMethodExpires: "08/26"
    };

    return {
      invoices,
      stats,
      doctors,
    };
  } catch (error) {
    console.error('Error fetching billing data:', error);
    const mockRenewalDate = new Date('2024-07-31');
    return {
      invoices: [],
      stats: {
        currentPlan: 'Pro Tier',
        assessmentsUsed: 0,
        assessmentsLimit: 100,
        nextInvoiceAmount: 29.0,
        renewalDate: mockRenewalDate,
        nextInvoiceDate: addMonths(mockRenewalDate, 1),
        paymentMethod: "Visa **** 4242",
        paymentMethodExpires: "08/26"
      },
      doctors: []
    };
  }
}
