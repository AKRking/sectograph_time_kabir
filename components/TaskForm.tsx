'use client';

import { useEffect, useState } from 'react';
import { TASK_CATEGORIES, Task, TaskCategory, TaskInput } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { convertTimeToMinutes, convertMinutesToTime } from '@/lib/time';

const COLOR_PALETTE = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
];

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: TaskInput) => Promise<void>;
  initialTask?: Task | null;
  isLoading?: boolean;
}

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  initialTask,
  isLoading,
}: TaskFormProps) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(initialTask?.title || '');
  const [startTime, setStartTime] = useState(
    initialTask ? convertMinutesToTime(initialTask.start_time) : '09:00'
  );
  const [endTime, setEndTime] = useState(
    initialTask ? convertMinutesToTime(initialTask.end_time) : '10:00'
  );
  const [project, setProject] = useState(initialTask?.project || '');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'work');
  const [date, setDate] = useState(initialTask?.date || todayISO);
  const [color, setColor] = useState(initialTask?.color || COLOR_PALETTE[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (initialTask) {
      setTitle(initialTask.title);
      setStartTime(convertMinutesToTime(initialTask.start_time));
      setEndTime(convertMinutesToTime(initialTask.end_time));
      setProject(initialTask.project || '');
      setCategory(initialTask.category || 'work');
      setDate(initialTask.date || todayISO);
      setColor(initialTask.color);
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setProject('');
      setCategory('work');
      setDate(todayISO);
      setColor(COLOR_PALETTE[0]);
    }
    setError('');
  }, [initialTask, open, todayISO]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        start_time: startMinutes,
        end_time: endMinutes,
        color,
        project: project.trim() || undefined,
        category,
        date,
      });

      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setProject('');
      setCategory('work');
      setDate(todayISO);
      setColor(COLOR_PALETTE[0]);
      onOpenChange(false);
    } catch (err) {
      setError('Failed to save task');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setProject('');
      setCategory('work');
      setDate(todayISO);
      setColor(COLOR_PALETTE[0]);
      setError('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project (optional)</Label>
            <Input
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Project name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)}>
              <SelectTrigger id="category" disabled={isLoading}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Task Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  disabled={isLoading}
                  className={`w-full h-8 rounded-lg border-2 transition-all ${
                    color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
