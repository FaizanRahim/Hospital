
"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

export function DatePicker({ name, defaultDate }: { name: string, defaultDate?: Date | null }) {
  const initialDate = defaultDate && isValidDate(defaultDate) ? defaultDate : null;

  // We use string state because Select values are strings
  const [day, setDay] = React.useState<string | undefined>(
    initialDate ? String(initialDate.getUTCDate()) : undefined
  );
  const [month, setMonth] = React.useState<string | undefined>(
    initialDate ? String(initialDate.getUTCMonth()) : undefined
  );
  const [year, setYear] = React.useState<string | undefined>(
    initialDate ? String(initialDate.getUTCFullYear()) : undefined
  );

  // This hidden input will hold the combined date value for the form
  const [isoDate, setIsoDate] = React.useState<string>(initialDate ? initialDate.toISOString() : '');

  React.useEffect(() => {
    if (day && month && year) {
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10); // 0-indexed
      const yearNum = parseInt(year, 10);
      
      const newDate = new Date(Date.UTC(yearNum, monthNum, dayNum));
      
      // Validate the date to handle cases like Feb 30th
      if (newDate.getUTCFullYear() === yearNum && newDate.getUTCMonth() === monthNum && newDate.getUTCDate() === dayNum) {
        setIsoDate(newDate.toISOString());
      } else {
        // an invalid date was formed, e.g. Feb 30. Clear the date
        setIsoDate('');
      }
    } else {
      setIsoDate('');
    }
  }, [day, month, year]);
  
  const handleDayChange = (value: string) => setDay(value);
  const handleMonthChange = (value: string) => {
    // If we change the month, we might need to adjust the day if it becomes invalid (e.g. from Jan 31 to Feb)
    if (day && year) {
        const newMonth = parseInt(value, 10);
        const newYear = parseInt(year, 10);
        const daysInNewMonth = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate();
        if (parseInt(day, 10) > daysInNewMonth) {
            setDay(String(daysInNewMonth));
        }
    }
    setMonth(value);
  };
  const handleYearChange = (value: string) => setYear(value);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
  }));
  
  const daysInMonth = (year && month) ? new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) + 1, 0)).getUTCDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      <input type="hidden" name={name} value={isoDate} />
      <div className="flex w-full gap-2">
        {/* Month Select */}
        <Select value={month} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-full" aria-label="Month">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Day Select */}
        <Select value={day} onValueChange={handleDayChange} disabled={!month || !year}>
          <SelectTrigger className="w-[100px]" aria-label="Day">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {days.map(d => (
              <SelectItem key={d} value={String(d)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Year Select */}
        <Select value={year} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[120px]" aria-label="Year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
