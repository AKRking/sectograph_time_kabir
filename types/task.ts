export interface Task {
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskInput {
  title: string;
  start_time: number;
  end_time: number;
  color: string;
}

export interface SplitTask {
  segment: 'am' | 'pm';
  title: string;
  start_time: number;
  end_time: number;
  color: string;
}
