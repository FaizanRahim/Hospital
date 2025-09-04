
import type { DocumentData, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email?: string;
  role: 'patient' | 'doctor' | 'admin';
  displayName?: string;
  linkedDoctor?: string;
  linkedPatients?: string[];
  createdAt: Timestamp;
}

export interface Assessment extends DocumentData {
  id: string;
  userId: string;
  doctorId: string;
  phq9Score: number;
  gad7Score: number;
  createdAt: Timestamp;
  answers: {
    phq9: { [key: string]: number };
    gad7: { [key: string]: number };
  };
  doctorNote?: string;
  additionalContext?: string;
  recommendationGenerated?: boolean;
  patientName?: string; // This is added dynamically in the app
}

export interface Resource {
    id: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    tags: string[];
    createdAt: Timestamp;
    createdBy: string;
}

export interface Notification {
    id: string;
    doctorId: string;
    patientId: string;
    message: string;
    read: boolean;
    createdAt: Timestamp;
}
