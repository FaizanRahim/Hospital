
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useUserProfile } from '@/context/user-profile-context';
import { getResourcesByDoctor, type Resource } from '@/lib/actions/resource-actions';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { ResourceCard } from '@/components/resource-card';
import { ResourceCardSkeleton } from '@/components/resource-card-skeleton';
import { AddResourceDialog } from '@/components/add-resource-dialog';
import { EditResourceDialog } from '@/components/edit-resource-dialog';
import { DeleteResourceDialog } from '@/components/delete-resource-dialog';
import { redirect } from 'next/navigation';

function ManageResourcesContent() {
  const { user, userProfile, loading: profileLoading } = useUserProfile();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const fetchedResources = await getResourcesByDoctor(user.uid);
    setResources(fetchedResources);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!profileLoading && userProfile?.role !== 'doctor') {
      redirect('/dashboard');
    }
    if (user) {
      fetchResources();
    }
  }, [user, fetchResources, userProfile, profileLoading]);
  
  if (profileLoading || !userProfile || userProfile.role !== 'doctor') {
    return (
        <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                 <h1 className="text-3xl font-bold tracking-tight">Manage Your Resources</h1>
                 <p className="text-muted-foreground">Add, edit, or remove the educational materials you share with patients.</p>
            </div>
            <AddResourceDialog onSuccess={fetchResources} />
        </div>

        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <ResourceCardSkeleton />
                 <ResourceCardSkeleton />
                 <ResourceCardSkeleton />
             </div>
        ) : resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource}>
                        <div className="flex gap-2">
                            <EditResourceDialog resource={resource} onSuccess={fetchResources} />
                            <DeleteResourceDialog resourceId={resource.id} onSuccess={fetchResources} />
                        </div>
                    </ResourceCard>
                ))}
            </div>
        ) : (
             <div className="text-center py-12 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">You haven&apos;t added any custom resources yet.</p>
            </div>
        )}
    </div>
  );
}

export default function ManageResourcesPage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <ManageResourcesContent />
      </Suspense>
    )
}
