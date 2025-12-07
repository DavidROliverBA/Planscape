/**
 * Date utility functions for timeline calculations
 */

/**
 * Parse a date string to Date object
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Format a date to string
 */
export function formatDate(
  date: Date,
  format: 'iso' | 'short' | 'medium' | 'long' | 'monthYear' | 'quarter' = 'iso',
): string {
  switch (format) {
    case 'iso':
      return date.toISOString().split('T')[0];
    case 'short':
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    case 'medium':
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'monthYear':
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      });
    case 'quarter': {
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `Q${q} ${date.getFullYear()}`;
    }
    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate difference in days between two dates
 */
export function diffDays(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Get the start of a quarter
 */
export function getQuarterStart(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

/**
 * Get the end of a quarter
 */
export function getQuarterEnd(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3 + 3, 0);
}

/**
 * Get the start of a year
 */
export function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Get the end of a year
 */
export function getYearEnd(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

/**
 * Get the start of a month
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of a month
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Check if two date ranges overlap
 */
export function dateRangeOverlaps(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 <= end2 && end1 >= start2;
}

/**
 * Clamp a date within a range
 */
export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return new Date(date);
}

/**
 * Get the quarter number (1-4) for a date
 */
export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get array of months between two dates
 */
export function getMonthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const current = getMonthStart(start);
  const endMonth = getMonthStart(end);

  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Get array of quarters between two dates
 */
export function getQuartersBetween(start: Date, end: Date): Date[] {
  const quarters: Date[] = [];
  const current = getQuarterStart(start);
  const endQuarter = getQuarterStart(end);

  while (current <= endQuarter) {
    quarters.push(new Date(current));
    current.setMonth(current.getMonth() + 3);
  }

  return quarters;
}

/**
 * Get array of years between two dates
 */
export function getYearsBetween(start: Date, end: Date): Date[] {
  const years: Date[] = [];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    years.push(new Date(year, 0, 1));
  }

  return years;
}

/**
 * Snap a date to the nearest week start (Monday)
 */
export function snapToWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Snap a date to the nearest month start
 */
export function snapToMonthStart(date: Date): Date {
  return getMonthStart(date);
}
