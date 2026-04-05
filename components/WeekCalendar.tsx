'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isSameWeek,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDisplayTime } from '@/lib/time';

interface WeekCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const HOUR_LINES = Array.from({ length: 25 }, (_, i) => i);

const resolveTaskDate = (task: Task): Date => {
  if (task.date) {
    return parseISO(task.date);
  }

  if (task.created_at) {
    return parseISO(task.created_at);
  }

  return new Date();
};

const toStartOfWeek = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });
const CATEGORY_BADGE_CLASS: Record<string, string> = {
  work: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  break: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  outside: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
};

export function WeekCalendar({ tasks, onTaskClick }: WeekCalendarProps) {
  const today = new Date();
  const [weekAnchor, setWeekAnchor] = useState<Date>(toStartOfWeek(today));
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index)),
    [weekAnchor]
  );

  const tasksByDay = useMemo(() => {
    return weekDays.map((day) =>
      tasks
        .filter((task) => isSameDay(resolveTaskDate(task), day))
        .sort((a, b) => a.start_time - b.start_time)
    );
  }, [tasks, weekDays]);

  return (
    <section className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Week View</h2>
          <p className="text-sm text-slate-600">
            {format(weekDays[0], 'd MMM')} - {format(weekDays[6], 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekAnchor(subWeeks(weekAnchor, 1))}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setWeekAnchor(toStartOfWeek(today));
              setSelectedDay(today);
            }}
            disabled={isSameWeek(weekAnchor, today, { weekStartsOn: 1 })}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekAnchor(addWeeks(weekAnchor, 1))}>
            Next Week
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[980px] grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-r border-slate-200" />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`h-16 border-r border-slate-200 text-left px-3 transition-colors ${
                  isSelected ? 'bg-blue-50' : isToday ? 'bg-slate-100' : 'bg-slate-50'
                }`}
              >
                <p className="text-xs text-slate-500">{format(day, 'EEE')}</p>
                <p className="text-sm font-semibold text-slate-900">{format(day, 'd MMM')}</p>
              </button>
            );
          })}

          <div className="relative h-[960px] border-r border-slate-200 bg-white">
            {HOUR_LINES.map((hour) => (
              <div
                key={`label-${hour}`}
                className="absolute left-0 right-0 text-[10px] text-slate-400 px-1 -translate-y-1/2"
                style={{ top: `${(hour / 24) * 100}%` }}
              >
                {hour === 24 ? '' : `${String(hour).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {weekDays.map((day, index) => {
            const dayTasks = tasksByDay[index];

            return (
              <div key={`col-${day.toISOString()}`} className="relative h-[960px] border-r border-slate-200 bg-white">
                {HOUR_LINES.map((hour) => (
                  <div
                    key={`line-${day.toISOString()}-${hour}`}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: `${(hour / 24) * 100}%` }}
                  />
                ))}

                {dayTasks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-300">No tasks</span>
                  </div>
                )}

                {dayTasks.map((task) => {
                  const top = (task.start_time / 1440) * 100;
                  const height = Math.max(((task.end_time - task.start_time) / 1440) * 100, 2);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onTaskClick?.(task)}
                      title={`${task.title} • ${getDisplayTime(task.start_time)} - ${getDisplayTime(task.end_time)}`}
                      className="absolute left-1 right-1 rounded-md px-2 py-1 text-left shadow-sm text-xs text-slate-900 transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ top: `${top}%`, height: `${height}%`, backgroundColor: task.color }}
                    >
                      <p className="font-medium truncate">{task.title || 'Untitled Task'}</p>
                      {task.category && (
                        <Badge
                          variant="secondary"
                          className={`mt-1 mb-1 h-4 px-1.5 text-[9px] capitalize ${CATEGORY_BADGE_CLASS[task.category] || ''}`}
                        >
                          {task.category}
                        </Badge>
                      )}
                      <p className="text-[10px] opacity-80">
                        {getDisplayTime(task.start_time)} - {getDisplayTime(task.end_time)}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
