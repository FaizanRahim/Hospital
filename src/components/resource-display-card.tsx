
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import type { Resource } from '@/lib/actions/resource-actions';

interface ResourceDisplayCardProps {
    // Can accept a full resource or a partial for display-only purposes
    resource: Partial<Resource> & { title: string, url: string, description?: string };
}

export function ResourceDisplayCard({ resource }: ResourceDisplayCardProps) {
  return (
    <Card className="bg-card/80 transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-base">{resource.title}</CardTitle>
      </CardHeader>
      {resource.description && (
        <CardContent>
            <p className="text-sm text-muted-foreground">{resource.description}</p>
        </CardContent>
      )}
      <CardFooter>
        <Button asChild variant="secondary" size="sm">
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            Visit Resource <ArrowUpRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
