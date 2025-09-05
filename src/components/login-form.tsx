
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import Link from 'next/link';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Sign In
    </Button>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Logged In!',
        description: "You will now be redirected to the dashboard.",
      });
      // The onAuthStateChanged listener in the context will handle the redirect.
      // But we can push to make it faster.
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <Label htmlFor="email-address" className="sr-only">
            Email address
          </Label>
          <Input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>
       {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/sign-up" className="font-medium text-primary hover:text-primary/90">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
