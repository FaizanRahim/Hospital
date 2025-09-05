
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { savePlatformLogo, getPlatformLogo, type PlatformSettingsActionState } from '../lib/actions/settings-actions';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Logo
    </Button>
  );
}

export function PlatformSettingsForm() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initialState: PlatformSettingsActionState = { status: 'idle' };
  const [state, formAction] = useFormState(savePlatformLogo, initialState);

  useEffect(() => {
    async function fetchCurrentLogo() {
      setLoading(true);
      const url = await getPlatformLogo();
      if (url) {
        setCurrentLogo(url);
        setPreview(url);
      }
      setLoading(false);
    }
    fetchCurrentLogo();
  }, []);

  useEffect(() => {
    if (state.status === 'success') {
      toast({ title: 'Success', description: state.message });
      // Use router.refresh() to force a server-side refetch of data
      router.refresh();
      if (state.logoUrl) {
          setCurrentLogo(state.logoUrl);
          setPreview(state.logoUrl);
      }
    } else if (state.status === 'error') {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(currentLogo); // Revert to current logo if selection is cancelled
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Customize the look and feel of the platform by uploading your own logo.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div>
            <Label>Platform Logo</Label>
            <div className="flex items-center gap-6 mt-2">
                <div className="h-20 w-20 rounded-md border flex items-center justify-center bg-muted/50 overflow-hidden">
                    {loading ? (
                        <Skeleton className="h-20 w-20" />
                    ) : preview ? (
                        <Image src={preview} alt="Logo preview" width={80} height={80} className="object-contain" />
                    ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                </div>
                <Input
                  ref={fileInputRef}
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleFileChange}
                  className="max-w-xs"
                />
            </div>
             <p className="text-xs text-muted-foreground mt-2">
                Recommended size: 128x128px. Supported formats: PNG, JPG, SVG, WEBP.
             </p>
          </div>
           {currentLogo && (
            <div>
              <Label htmlFor="logoUrl">Current Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="text"
                readOnly
                value={currentLogo}
                className="mt-2 bg-muted/50 text-muted-foreground text-xs"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
