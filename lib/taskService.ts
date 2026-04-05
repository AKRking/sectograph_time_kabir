import { supabase } from './supabase';
import { Task, TaskInput } from '@/types/task';

export async function fetchTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('date', { ascending: true, nullsFirst: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function createTask(taskInput: TaskInput): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: taskInput.title,
          start_time: taskInput.start_time,
          end_time: taskInput.end_time,
          color: taskInput.color,
          project: taskInput.project,
          category: taskInput.category,
          date: taskInput.date,
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
}

export async function updateTask(id: string, taskInput: TaskInput): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: taskInput.title,
        start_time: taskInput.start_time,
        end_time: taskInput.end_time,
        color: taskInput.color,
        project: taskInput.project,
        category: taskInput.category,
        date: taskInput.date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
}
