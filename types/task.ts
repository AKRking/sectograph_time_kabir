export interface Task {
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  color: string;
  project?: string;
  category?: TaskCategory;
  date?: string;
  created_at?: string;
  updated_at?: string;
}

export const TASK_CATEGORIES = ['work', 'break', 'outside'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface TaskInput {
  title: string;
  start_time: number;
  end_time: number;
  color: string;
  project?: string;
  category?: TaskCategory;
  date?: string;
}

export interface SplitTask {
  segment: 'am' | 'pm';
  title: string;
  start_time: number;
  end_time: number;
  color: string;
}
