
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { ArrowUpRight, Edit, Trash } from 'lucide-react';
import type { Resource } from '../lib/actions/resource-actions';
import type { ReactNode } from 'react';

interface ResourceCardProps {
  resource: Resource;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: ReactNode;
}

export function ResourceCard({ resource, onEdit, onDelete, children }: ResourceCardProps) {
  return (
    <Card className="bg-card/80 transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-base">{resource.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{resource.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button asChild variant="secondary" size="sm">
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            Visit Resource <ArrowUpRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        {children ?? (
          (onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        )}
      </CardFooter>
    </Card>
  );
}
