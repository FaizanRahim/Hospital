
'use client';

import { Suspense } from 'react';
import { PatientLoginForm } from '@/components/patient-login-form';
import Link from 'next/link';
import { BrainCircuit, Loader2 } from 'lucide-react';


function PatientLoginPageContent() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
                        <BrainCircuit className="h-7 w-7 text-primary" />
                        <span className="font-headline">Mindful Assessment Platform</span>
                    </Link>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col p-6 space-y-1.5">
                        <h3 className="font-semibold tracking-tight text-2xl text-center">Patient Portal Login</h3>
                        <p className="text-sm text-muted-foreground text-center">
                            Sign in to complete your assessments.
                        </p>
                    </div>
                    <div className="p-6 pt-0">
                         <PatientLoginForm />
                    </div>
                </div>
                 <div className="mt-4 text-center text-sm">
                    <p className="text-muted-foreground">
                        Are you a doctor or administrator?{' '}
                        <Link href="/login" className="underline text-primary">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}


export default function PatientLoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <PatientLoginPageContent />
    </Suspense>
  );
}
