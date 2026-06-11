export interface CalendarDay {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMonthMatrix(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

  const start = new Date(year, month, 1 - firstWeekday);

  const weeks: CalendarDay[][] = [];
  const current = new Date(start);

  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      days.push({
        date: new Date(current),
        dateKey: formatDateKey(current),
        inCurrentMonth: current.getMonth() === month,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}
