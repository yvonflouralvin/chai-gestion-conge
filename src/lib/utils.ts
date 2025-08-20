
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, isSunday, isSameDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A mock list of public holidays
const publicHolidays: Date[] = [
  new Date('2024-01-01'), // New Year's Day
  new Date('2024-07-04'), // Independence Day
  new Date('2024-12-25'), // Christmas Day
];

export function calculateLeaveDays(startDate: Date | undefined, endDate: Date | undefined): number {
  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  const interval = eachDayOfInterval({ start: startDate, end: endDate });

  const workingDays = interval.filter(day => {
    const isHoliday = publicHolidays.some(holiday => isSameDay(day, holiday));
    return !isSunday(day) && !isHoliday;
  });

  return workingDays.length;
}
