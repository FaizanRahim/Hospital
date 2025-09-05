
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useUserProfile } from '../../../context/user-profile-context';
import { getResourcesForPatient, type Resource } from '../../../lib/actions/resource-actions';
import { Loader2 } from 'lucide-react';
import { ResourceCard } from '../../../components/resource-card';
import { ResourceCardSkeleton } from '../../../components/resource-card-skeleton';


function ResourcesContent() {
  const { user, loading: profileLoading } = useUserProfile();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const fetchedResources = await getResourcesForPatient(user.uid);
    setResources(fetchedResources);
    setLoading(false);
  }, [user]);
  
  useEffect(() => {
    if (!profileLoading && user) {
        fetchResources();
    }
  }, [user, profileLoading, fetchResources]);
  
  return (
    <div className="space-y-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Health & Wellness Resources</h1>
            <p className="text-muted-foreground">A list of curated resources from your provider.</p>
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
                    <ResourceCard key={resource.id} resource={resource} />
                ))}
            </div>
        ) : (
             <div className="text-center py-12 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">Your doctor has not added any resources yet.</p>
            </div>
        )}
    </div>
  );
}

export default function ResourcesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ResourcesContent />
        </Suspense>
    )
}
