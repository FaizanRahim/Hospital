import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from './ui/card';
import { Skeleton } from './ui/skeleton';

export function ResourceCardSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-5/6 rounded-md" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32 mt-2 rounded-md" />
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-5/6 rounded-md" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32 mt-2 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}
