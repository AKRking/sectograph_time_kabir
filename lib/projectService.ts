import { supabase } from './supabase';

export interface ProjectRecord {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectInput {
  name: string;
  color: string;
}

export async function fetchProjects(): Promise<ProjectRecord[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function createProject(projectInput: ProjectInput): Promise<ProjectRecord | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectInput.name,
          color: projectInput.color,
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProject(id: string, projectInput: ProjectInput): Promise<ProjectRecord | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: projectInput.name,
        color: projectInput.color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}
