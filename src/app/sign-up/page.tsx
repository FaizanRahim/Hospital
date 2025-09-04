
'use client';

import { Suspense } from 'react';
import { SignUpForm } from '@/components/sign-up-form';
import { Loader2 } from 'lucide-react';

function SignUpPageContent() {
    return (
        <div className="flex min-h-screen flex-col bg-secondary">
          <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg">
                <SignUpForm />
            </div>
           </main>
        </div>
    )
}

export default function SignUpPage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <SignUpPageContent />
      </Suspense>
    )
}


