
'use client';

import { Suspense } from 'react';
import { AddPatientDialog } from '../../components/add-patient-dialog';
import { Loader2 } from 'lucide-react';

function KioskContent() {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
                Mental Health Screening Kiosk
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Welcome! Please add yourself as a new patient to begin your self-assessment. A member of our staff will be with you shortly.
            </p>
            <AddPatientDialog source="kiosk" />
        </div>
    )
}

export default function KioskPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <KioskContent />
        </Suspense>
    )
}
