
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User, Briefcase } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getPlatformLogo } from '@/lib/actions/settings-actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Account
    </Button>
  );
}

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      const url = await getPlatformLogo();
      setLogoUrl(url);
    }
    fetchLogo();
  }, []);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, email, role, {
        firstName,
        lastName,
      });
      toast({
        title: "Account Created!",
        description: "You will now be redirected to the dashboard.",
      });
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.message;
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
      });
    }
  };

  const finalLogoUrl = logoUrl || "https://ourwellnesslife.com/wp-content/uploads/2023/06/owl-logo-w.png";

  return (
    <Card className="shadow-lg">
      <div className="bg-[#1D2939] text-white p-8 text-center rounded-t-lg">
        <div className="flex justify-center mb-4">
          <Image src={finalLogoUrl} alt="Platform Logo" width={50} height={50} className="h-12 w-auto" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">CREATE AN ACCOUNT</h1>
        <p className="text-sm text-gray-300">Join Our Wellness Life</p>
      </div>

      <CardContent className="p-8 space-y-6">
        <form onSubmit={handleRegister}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                role === 'patient'
                  ? "bg-red-50 border-primary text-primary font-semibold"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              )}
            >
              <User className="h-5 w-5" />
              <span>Patient</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                role === 'doctor'
                  ? "bg-red-50 border-primary text-primary font-semibold"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              )}
            >
              <Briefcase className="h-5 w-5" />
              <span>Healthcare Provider</span>
            </button>
          </div>
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
          </div>

          {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}

          <div className="mt-8">
            <SubmitButton />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
              Log In
            </Link>
          </p>
        </form>
      </CardContent>

      <div className="bg-[#1D2939] text-white text-center p-4 rounded-b-lg">
        <p className="text-xs">&copy; 2025 OUR WELLNESS LIFE, INC. All rights reserved.</p>
      </div>
    </Card>
  );
}
