export function convertTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function convertMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function getAngleFromMinutes(minutes: number, period: 'am' | 'pm'): number {
  let adjustedMinutes = minutes;

  if (period === 'pm') {
    adjustedMinutes = minutes - 720;
  }

  return (adjustedMinutes * 0.5) % 360;
}

export function getCurrentTimeInMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function getPeriodForTime(minutes: number): 'am' | 'pm' {
  return minutes < 720 ? 'am' : 'pm';
}

export function getDisplayTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const displayHours = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
}

export interface SplitTaskSegment {
  startTime: number;
  endTime: number;
  period: 'am' | 'pm';
}

export function splitTaskByPeriod(
  startTime: number,
  endTime: number
): SplitTaskSegment[] {
  const segments: SplitTaskSegment[] = [];
  const AM_END = 720;

  if (startTime < AM_END && endTime > AM_END) {
    segments.push({
      startTime: startTime,
      endTime: AM_END,
      period: 'am',
    });
    segments.push({
      startTime: AM_END,
      endTime: endTime,
      period: 'pm',
    });
  } else {
    const period = startTime < AM_END ? 'am' : 'pm';
    segments.push({
      startTime: startTime,
      endTime: endTime,
      period: period,
    });
  }

  return segments;
}
