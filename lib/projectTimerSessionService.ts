import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

const ACTIVE_TIMER_ROW_ID = 1;

export interface ActiveProjectSessionRecord {
  id: number;
  project_id: string;
  started_at: string;
  updated_at?: string;
}

interface SetActiveProjectSessionInput {
  projectId: string;
  startedAt: string;
}

const asActiveSessionRecord = (value: unknown): ActiveProjectSessionRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== 'number' ||
    typeof candidate.project_id !== 'string' ||
    typeof candidate.started_at !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    project_id: candidate.project_id,
    started_at: candidate.started_at,
    updated_at: typeof candidate.updated_at === 'string' ? candidate.updated_at : undefined,
  };
};

export async function fetchActiveProjectSession(): Promise<ActiveProjectSessionRecord | null> {
  try {
    const { data, error } = await supabase
      .from('project_timer_state')
      .select('*')
      .eq('id', ACTIVE_TIMER_ROW_ID)
      .maybeSingle();

    if (error) throw error;
    return asActiveSessionRecord(data);
  } catch (error) {
    console.error('Error fetching active project session:', error);
    return null;
  }
}

export async function setActiveProjectSession({
  projectId,
  startedAt,
}: SetActiveProjectSessionInput): Promise<ActiveProjectSessionRecord | null> {
  try {
    const { data, error } = await supabase
      .from('project_timer_state')
      .upsert(
        [
          {
            id: ACTIVE_TIMER_ROW_ID,
            project_id: projectId,
            started_at: startedAt,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return asActiveSessionRecord(data);
  } catch (error) {
    console.error('Error setting active project session:', error);
    return null;
  }
}

export async function clearActiveProjectSession(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('project_timer_state')
      .delete()
      .eq('id', ACTIVE_TIMER_ROW_ID);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing active project session:', error);
    return false;
  }
}

export function subscribeToActiveProjectSession(
  onChange: (session: ActiveProjectSessionRecord | null) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`project-timer-state-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_timer_state',
        filter: `id=eq.${ACTIVE_TIMER_ROW_ID}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange(null);
          return;
        }

        onChange(asActiveSessionRecord(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
