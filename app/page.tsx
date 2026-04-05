'use client';

import { useState, useEffect } from 'react';
import { ClockDial } from '@/components/ClockDial';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Task, TaskInput } from '@/types/task';
import { getDisplayTime } from '@/lib/time';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'sectograph_tasks';

const generateSoftColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 78%)`;
};

const parseDurationMinutes = (raw: string): number | null => {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;

  const durationRegex = /(\d+)\s*([hm])/g;
  const units: Array<{ amount: number; unit: string }> = [];
  let match: RegExpExecArray | null = durationRegex.exec(normalized);

  while (match) {
    units.push({ amount: Number(match[1]), unit: match[2] });
    match = durationRegex.exec(normalized);
  }

  const leftover = normalized.replace(/(\d+)\s*([hm])/g, '').replace(/\s+/g, '');

  if (!units.length || leftover) return null;

  let hours = 0;
  let minutes = 0;

  for (const { amount, unit } of units) {
    if (Number.isNaN(amount)) return null;

    if (unit === 'h') hours += amount;
    if (unit === 'm') minutes += amount;
  }

  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
};

const parseStoredTasks = (value: string | null): Task[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (task) =>
          task &&
          typeof task.id === 'string' &&
          typeof task.title === 'string' &&
          typeof task.start_time === 'number' &&
          typeof task.end_time === 'number' &&
          typeof task.color === 'string'
      )
      .sort((a, b) => a.start_time - b.start_time);
  } catch {
    return [];
  }
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<number | null>(null);
  const [durationInput, setDurationInput] = useState('');
  const [taskNameInput, setTaskNameInput] = useState('');
  const [previewColor, setPreviewColor] = useState(generateSoftColor());
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setTasks(parseStoredTasks(localStorage.getItem(LOCAL_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const parsedDurationMinutes = parseDurationMinutes(durationInput);
  const canBuildPreview = selectedStartTime !== null && parsedDurationMinutes !== null;

  const previewTask: Task | null = canBuildPreview
    ? {
        id: 'preview',
        title: taskNameInput.trim() || 'Untitled Task',
        start_time: selectedStartTime,
        end_time: Math.min(selectedStartTime + parsedDurationMinutes, 1440),
        color: previewColor,
      }
    : null;

  const handleSubmit = async (taskInput: TaskInput) => {
    setIsLoading(true);
    try {
      if (editingTask) {
        setTasks((prev) =>
          prev
            .map((task) =>
              task.id === editingTask.id
                ? { ...task, ...taskInput, updated_at: new Date().toISOString() }
                : task
            )
            .sort((a, b) => a.start_time - b.start_time)
        );
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
        setEditingTask(null);
      } else {
        const created: Task = {
          id: crypto.randomUUID(),
          ...taskInput,
          created_at: new Date().toISOString(),
        };
        setTasks((prev) => [...prev, created].sort((a, b) => a.start_time - b.start_time));
        toast({
          title: 'Success',
          description: 'Task created successfully',
        });
      }
      setFormOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setInteractiveMode(false);
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const resetInteractiveFlow = () => {
    setInteractiveMode(false);
    setSelectedStartTime(null);
    setDurationInput('');
    setTaskNameInput('');
    setPreviewColor(generateSoftColor());
  };

  const handleStartInteractiveAdd = () => {
    setEditingTask(null);
    setFormOpen(false);
    setInteractiveMode(true);
    setSelectedStartTime(null);
    setDurationInput('');
    setTaskNameInput('');
    setPreviewColor(generateSoftColor());
    toast({
      title: 'Interactive mode enabled',
      description: 'Click either clock to choose a start time.',
    });
  };

  const handleDialStartSelection = (minutes: number) => {
    setSelectedStartTime(minutes);
  };

  const handleFinalizeInteractiveTask = () => {
    if (!previewTask || parsedDurationMinutes === null) return;

    const newTask: Task = {
      ...previewTask,
      id: crypto.randomUUID(),
      title: taskNameInput.trim() || 'Untitled Task',
      end_time: Math.min(previewTask.start_time + parsedDurationMinutes, 1440),
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, newTask].sort((a, b) => a.start_time - b.start_time));
    resetInteractiveFlow();
    toast({
      title: 'Task created',
      description: `${newTask.title}: ${getDisplayTime(newTask.start_time)} - ${getDisplayTime(newTask.end_time)}`,
    });
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Sectograph</h1>
          <p className="text-slate-600">Visualize your day across two 12-hour clocks</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-8 bg-white rounded-xl shadow-lg p-8">
              <ClockDial
                period="am"
                tasks={tasks}
                interactive={interactiveMode}
                minuteStep={5}
                selectedTime={selectedStartTime}
                previewTask={previewTask}
                onSelectTime={handleDialStartSelection}
                onTaskClick={handleEdit}
              />
              <ClockDial
                period="pm"
                tasks={tasks}
                interactive={interactiveMode}
                minuteStep={5}
                selectedTime={selectedStartTime}
                previewTask={previewTask}
                onSelectTime={handleDialStartSelection}
                onTaskClick={handleEdit}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Tasks</h2>
              <Button
                onClick={handleStartInteractiveAdd}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {interactiveMode && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-800">
                  {selectedStartTime === null
                    ? 'Step 1: Click a clock to choose start time'
                    : `Start Time: ${getDisplayTime(selectedStartTime)}`}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="durationInput">Enter duration (e.g. 1h 13m)</Label>
                  <Input
                    id="durationInput"
                    placeholder="1h 13m"
                    value={durationInput}
                    onChange={(event) => setDurationInput(event.target.value)}
                  />
                </div>

                {durationInput && parsedDurationMinutes === null && (
                  <p className="text-xs text-red-500">
                    Use formats like 1h13m, 2h, 45m, or 1h 5m.
                  </p>
                )}

                {previewTask && (
                  <p className="text-xs text-slate-600">
                    Preview: {getDisplayTime(previewTask.start_time)} -{' '}
                    {getDisplayTime(previewTask.end_time)}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="taskNameInput">Task name (optional)</Label>
                  <Input
                    id="taskNameInput"
                    placeholder="Untitled Task"
                    value={taskNameInput}
                    onChange={(event) => setTaskNameInput(event.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleFinalizeInteractiveTask}
                    disabled={!previewTask}
                    className="flex-1"
                  >
                    Save Task
                  </Button>
                  <Button variant="outline" onClick={resetInteractiveFlow} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              <TaskList
                tasks={tasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        <TaskForm
          open={formOpen}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleSubmit}
          initialTask={editingTask}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
