
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { ResourceDisplayCard } from './resource-display-card';
import type { ResourceRecommendationsOutput } from '@/lib/actions';
import { HeartPulse, HeartHandshake, MessageSquare, HelpCircle } from 'lucide-react';

const categoryIcons: { [key: string]: React.ElementType } = {
  Crisis: HeartPulse,
  Coping: HeartHandshake,
  Therapy: MessageSquare,
};

export function ResourceList({ recommendations }: { recommendations: ResourceRecommendationsOutput }) {
  if (!recommendations?.resources || recommendations.resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] p-8 text-center bg-card/50 rounded-lg border-dashed">
        <p className="text-muted-foreground">No recommendations available for the given scores.</p>
      </div>
    );
  }

  const groupedResources = recommendations.resources.reduce((acc, resource) => {
    const { category } = resource;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(resource);
    return acc;
  }, {} as Record<string, typeof recommendations.resources>);

  const defaultOpen = Object.keys(groupedResources);

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full space-y-4">
      {Object.entries(groupedResources).map(([category, resources]) => {
        const Icon = categoryIcons[category] || HelpCircle;
        return (
          <AccordionItem key={category} value={category} className="border-none">
             <Card className="overflow-hidden shadow-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card [&[data-state=open]]:border-b">
                    <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground font-headline">{category}</h3>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                    <div className="p-6 space-y-4 bg-secondary/40">
                        {resources.map((resource, index) => (
                            <ResourceDisplayCard key={index} resource={resource} />
                        ))}
                    </div>
                </AccordionContent>
            </Card>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
