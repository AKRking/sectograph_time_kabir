'use client';

import { useState, useEffect } from 'react';
import { ClockDial } from '@/components/ClockDial';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { WeekCalendar } from '@/components/WeekCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TASK_CATEGORIES, Task, TaskCategory, TaskInput } from '@/types/task';
import { getDisplayTime } from '@/lib/time';
import { createTask, deleteTask, fetchTasks, updateTask } from '@/lib/taskService';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

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

const getTaskDateISO = (task: Task): string => {
  if (task.date) return task.date;
  if (task.created_at) return format(parseISO(task.created_at), 'yyyy-MM-dd');
  return format(new Date(), 'yyyy-MM-dd');
};

const sortTasks = (items: Task[]) => {
  return [...items].sort((a, b) => {
    const dateComparison = getTaskDateISO(a).localeCompare(getTaskDateISO(b));
    if (dateComparison !== 0) return dateComparison;
    return a.start_time - b.start_time;
  });
};

const formatClockDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((unit) => unit.toString().padStart(2, '0')).join(':');
};

export default function Home() {
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<number | null>(null);
  const [durationInput, setDurationInput] = useState('');
  const [taskNameInput, setTaskNameInput] = useState('');
  const [taskProjectInput, setTaskProjectInput] = useState('');
  const [taskCategoryInput, setTaskCategoryInput] = useState<TaskCategory>('work');
  const [selectedTaskDate, setSelectedTaskDate] = useState(todayISO);
  const [previewColor, setPreviewColor] = useState(generateSoftColor());
  const { toast } = useToast();

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      const fetchedTasks = await fetchTasks();
      setTasks(sortTasks(fetchedTasks));
      setIsLoading(false);
    };

    loadTasks();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const parsedDurationMinutes = parseDurationMinutes(durationInput);
  const canBuildPreview = selectedStartTime !== null && parsedDurationMinutes !== null;
  const todaysTasks = tasks.filter((task) => getTaskDateISO(task) === todayISO);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const currentTask = [...todaysTasks]
    .reverse()
    .find((task) => nowMinutes >= task.start_time && nowMinutes < task.end_time);
  const currentTimeText = format(now, 'HH:mm:ss');
  const currentTaskStartSeconds = currentTask ? currentTask.start_time * 60 : 0;
  const currentTaskEndSeconds = currentTask ? currentTask.end_time * 60 : 0;
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const elapsedSeconds = currentTask ? Math.max(0, nowSeconds - currentTaskStartSeconds) : 0;
  const totalTaskSeconds = currentTask ? Math.max(1, currentTaskEndSeconds - currentTaskStartSeconds) : 0;
  const remainingSeconds = currentTask
    ? Math.max(0, currentTaskEndSeconds - nowSeconds)
    : 0;
  const currentTaskProgress = currentTask
    ? Math.min(100, Math.max(0, (elapsedSeconds / totalTaskSeconds) * 100))
    : 0;

  const previewTask: Task | null = canBuildPreview
    ? {
        id: 'preview',
        title: taskNameInput.trim() || 'Untitled Task',
        start_time: selectedStartTime,
        end_time: Math.min(selectedStartTime + parsedDurationMinutes, 1440),
        color: previewColor,
        project: taskProjectInput.trim() || undefined,
        category: taskCategoryInput,
        date: selectedTaskDate,
      }
    : null;
  const dialPreviewTask = previewTask?.date === todayISO ? previewTask : null;

  const handleSubmit = async (taskInput: TaskInput) => {
    setIsLoading(true);
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, taskInput);
        if (!updated) throw new Error('Update failed');

        setTasks((prev) =>
          sortTasks(prev.map((task) => (task.id === editingTask.id ? updated : task)))
        );
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
        setEditingTask(null);
      } else {
        const created = await createTask(taskInput);
        if (!created) throw new Error('Create failed');

        setTasks((prev) => sortTasks([...prev, created]));
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
      const deleted = await deleteTask(id);
      if (!deleted) throw new Error('Delete failed');

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
    setTaskProjectInput('');
    setTaskCategoryInput('work');
    setSelectedTaskDate(todayISO);
    setPreviewColor(generateSoftColor());
  };

  const handleStartInteractiveAdd = () => {
    setEditingTask(null);
    setFormOpen(false);
    setInteractiveMode(true);
    setSelectedStartTime(null);
    setDurationInput('');
    setTaskNameInput('');
    setTaskProjectInput('');
    setTaskCategoryInput('work');
    setSelectedTaskDate(todayISO);
    setPreviewColor(generateSoftColor());
    toast({
      title: 'Interactive mode enabled',
      description: 'Click either clock to choose a start time.',
    });
  };

  const handleDialStartSelection = (minutes: number) => {
    setSelectedStartTime(minutes);
  };

  const handleFinalizeInteractiveTask = async () => {
    if (!previewTask || parsedDurationMinutes === null) return;

    const taskInput: TaskInput = {
      title: taskNameInput.trim() || 'Untitled Task',
      start_time: previewTask.start_time,
      end_time: Math.min(previewTask.start_time + parsedDurationMinutes, 1440),
      color: previewTask.color,
      project: taskProjectInput.trim() || undefined,
      category: taskCategoryInput,
      date: selectedTaskDate,
    };

    setIsLoading(true);
    try {
      const created = await createTask(taskInput);
      if (!created) throw new Error('Create failed');

      setTasks((prev) => sortTasks([...prev, created]));
      resetInteractiveFlow();
      toast({
        title: 'Task created',
        description: `${created.title}: ${getDisplayTime(created.start_time)} - ${getDisplayTime(created.end_time)}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
                tasks={todaysTasks}
                interactive={interactiveMode}
                minuteStep={5}
                selectedTime={selectedStartTime}
                previewTask={dialPreviewTask}
                onSelectTime={handleDialStartSelection}
                onTaskClick={handleEdit}
              />
              <ClockDial
                period="pm"
                tasks={todaysTasks}
                interactive={interactiveMode}
                minuteStep={5}
                selectedTime={selectedStartTime}
                previewTask={dialPreviewTask}
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

            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-500">Digital clock</span>
                {/* <span className="font-mono text-lg font-semibold text-slate-900">{currentTimeText}</span> */}
                <span className="font-mono text-lg font-semibold text-slate-900">{formatClockDuration(remainingSeconds)}</span>
                {/* <span>Left {formatClockDuration(remainingSeconds)}</span> */}
              </div>
              {currentTask ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-800 truncate">{currentTask.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                    <span>Elapsed {formatClockDuration(elapsedSeconds)}</span>
                    <span>Left {formatClockDuration(remainingSeconds)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${currentTaskProgress}%`, backgroundColor: currentTask.color }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No task is running right now.</p>
              )}
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

                <div className="space-y-2">
                  <Label htmlFor="taskProjectInput">Project (optional)</Label>
                  <Input
                    id="taskProjectInput"
                    placeholder="Project name"
                    value={taskProjectInput}
                    onChange={(event) => setTaskProjectInput(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskCategoryInput">Category</Label>
                  <Select
                    value={taskCategoryInput}
                    onValueChange={(value) => setTaskCategoryInput(value as TaskCategory)}
                  >
                    <SelectTrigger id="taskCategoryInput">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDateInput">Date</Label>
                  <Input
                    id="taskDateInput"
                    type="date"
                    value={selectedTaskDate}
                    onChange={(event) => setSelectedTaskDate(event.target.value)}
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

            <TaskList tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
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
      <div className="max-w-7xl mx-auto mt-8">
        <WeekCalendar tasks={tasks} onTaskClick={handleEdit} />
      </div>
    </div>
  );
}
