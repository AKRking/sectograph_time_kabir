'use client';

import { useState, useEffect } from 'react';
import { ClockDial } from '@/components/ClockDial';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { Task, TaskInput } from '@/types/task';
import { fetchTasks, createTask, updateTask, deleteTask } from '@/lib/taskService';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (taskInput: TaskInput) => {
    setIsLoading(true);
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, taskInput);
        if (updated) {
          setTasks((prev) =>
            prev.map((t) => (t.id === editingTask.id ? updated : t))
          );
          toast({
            title: 'Success',
            description: 'Task updated successfully',
          });
        }
        setEditingTask(null);
      } else {
        const created = await createTask(taskInput);
        if (created) {
          setTasks((prev) => [...prev, created].sort((a, b) => a.start_time - b.start_time));
          toast({
            title: 'Success',
            description: 'Task created successfully',
          });
        }
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
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteTask(id);
      if (success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        toast({
          title: 'Success',
          description: 'Task deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
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
              <ClockDial period="am" tasks={tasks} />
              <ClockDial period="pm" tasks={tasks} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Tasks</h2>
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setFormOpen(true);
                }}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

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
