
'use client';

import { format } from 'date-fns';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

const chartConfig = {
  phq9: {
    label: "PHQ-9",
    color: "hsl(var(--chart-1))",
  },
  gad7: {
    label: "GAD-7",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export function AssessmentChart({ assessments }: { assessments: any[] }) {
  const chartData = [...assessments]
    .reverse()
    .map((a) => ({
      date: format(new Date(a.createdAt.seconds * 1000), 'MMM d'),
      phq9: a.phq9Score,
      gad7: a.gad7Score,
    }));

  return (
    <Card>
        <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
            <CardDescription>
                {chartData.length > 1 
                    ? "This chart shows the progression of your assessment scores over time."
                    : "Complete more assessments to see your progress over time."
                }
            </CardDescription>
        </CardHeader>
        <CardContent>
             <div className="h-[250px] w-full">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        />
                        <YAxis
                        domain={[0, 27]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                        dataKey="phq9"
                        type="monotone"
                        stroke="var(--color-phq9)"
                        strokeWidth={2}
                        dot={true}
                        name="PHQ-9"
                        />
                        <Line
                        dataKey="gad7"
                        type="monotone"
                        stroke="var(--color-gad7)"
                        strokeWidth={2}
                        dot={true}
                        name="GAD-7"
                        />
                    </LineChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border-dashed p-4">
                        <p className="text-muted-foreground">No data available to display chart.</p>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  )
}
