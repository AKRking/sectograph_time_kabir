'use client';

import { Task } from '@/types/task';
import { getDisplayTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { Trash2, CreditCard as Edit2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function TaskList({ tasks, onEdit, onDelete, isLoading }: TaskListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-slate-500">No tasks scheduled yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: task.color }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate">{task.title}</h3>
                <p className="text-sm text-slate-500">
                  {getDisplayTime(task.start_time)} - {getDisplayTime(task.end_time)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                disabled={isLoading || isDeleting}
                className="hover:bg-blue-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(task.id)}
                disabled={isLoading || isDeleting}
                className="hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
