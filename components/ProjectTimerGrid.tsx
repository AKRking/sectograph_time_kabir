'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectTimerButton } from '@/components/ProjectTimerButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject, fetchProjects, ProjectRecord, updateProject } from '@/lib/projectService';

const ACTIVE_SESSION_STORAGE_KEY = 'sectograph-active-session-v1';

type Project = ProjectRecord;

type ActiveSession = {
  projectId: string;
  startedAt: string;
};

export interface ProjectSessionPayload {
  project: Project;
  startedAt: Date;
  endedAt: Date;
  elapsedSeconds: number;
}

interface ProjectTimerGridProps {
  onSessionComplete: (payload: ProjectSessionPayload) => Promise<boolean>;
}

const formatElapsed = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((unit) => unit.toString().padStart(2, '0')).join(':');
};

const randomProjectColor = () => {
  const randomChannel = () => Math.floor(120 + Math.random() * 100).toString(16).padStart(2, '0');
  return `#${randomChannel()}${randomChannel()}${randomChannel()}`;
};

export function ProjectTimerGrid({ onSessionComplete }: ProjectTimerGridProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [hasLoadedActiveSession, setHasLoadedActiveSession] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingProjects, setIsUpdatingProjects] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(randomProjectColor);
  const [editingProjectId, setEditingProjectId] = useState<string>('');
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectColor, setEditingProjectColor] = useState('#7f9cf5');

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setIsProjectsLoading(true);
      const fetchedProjects = await fetchProjects();
      if (!isMounted) return;

      setProjects(fetchedProjects.filter((project) => project.name && project.color));
      setIsProjectsLoading(false);
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as ActiveSession;
      if (!parsed || typeof parsed.projectId !== 'string' || typeof parsed.startedAt !== 'string') return;

      setActiveSession(parsed);
    } catch {
      // Ignore malformed values and start with no active session.
    } finally {
      setHasLoadedActiveSession(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedActiveSession) return;

    if (!activeSession) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(activeSession));
  }, [activeSession, hasLoadedActiveSession]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!activeSession) return;

    const projectStillExists = projects.some((project) => project.id === activeSession.projectId);
    if (!projectStillExists) {
      setActiveSession(null);
    }
  }, [activeSession, projects]);

  const activeProject = useMemo(() => {
    if (!activeSession) return null;
    return projects.find((project) => project.id === activeSession.projectId) ?? null;
  }, [activeSession, projects]);

  useEffect(() => {
    if (!projects.length) {
      setEditingProjectId('');
      setEditingProjectName('');
      return;
    }

    if (!editingProjectId || !projects.some((project) => project.id === editingProjectId)) {
      const firstProject = projects[0];
      setEditingProjectId(firstProject.id);
      setEditingProjectName(firstProject.name);
      setEditingProjectColor(firstProject.color);
    }
  }, [editingProjectId, projects]);

  const getElapsedSeconds = (session: ActiveSession) => {
    const startMs = new Date(session.startedAt).getTime();
    return Math.max(0, Math.floor((now - startMs) / 1000));
  };

  const stopCurrentSession = async (): Promise<boolean> => {
    if (!activeSession) return true;

    const project = projects.find((item) => item.id === activeSession.projectId);
    if (!project) {
      setActiveSession(null);
      return true;
    }

    setIsSaving(true);
    const startedAt = new Date(activeSession.startedAt);
    const endedAt = new Date();
    const elapsedSeconds = Math.max(1, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

    const saved = await onSessionComplete({
      project,
      startedAt,
      endedAt,
      elapsedSeconds,
    });

    setIsSaving(false);
    if (saved) {
      setActiveSession(null);
    }

    return saved;
  };

  const handleProjectClick = async (project: Project) => {
    if (isSaving || isUpdatingProjects) return;

    if (activeSession?.projectId === project.id) {
      await stopCurrentSession();
      return;
    }

    if (activeSession) {
      const stopped = await stopCurrentSession();
      if (!stopped) return;
    }

    setActiveSession({
      projectId: project.id,
      startedAt: new Date().toISOString(),
    });
  };

  const handleAddProject = async () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName || isUpdatingProjects) return;

    const exists = projects.some((project) => project.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) return;

    setIsUpdatingProjects(true);
    const createdProject = await createProject({
      name: trimmedName,
      color: newProjectColor,
    });
    setIsUpdatingProjects(false);
    if (!createdProject) return;

    setProjects((prev) => [...prev, createdProject]);
    setNewProjectName('');
    setNewProjectColor(randomProjectColor());
    setIsAdding(false);
  };

  const handleSelectProjectForSettings = (projectId: string) => {
    const selectedProject = projects.find((project) => project.id === projectId);
    if (!selectedProject) return;

    setEditingProjectId(selectedProject.id);
    setEditingProjectName(selectedProject.name);
    setEditingProjectColor(selectedProject.color);
  };

  const handleSaveProjectSettings = async () => {
    const trimmedName = editingProjectName.trim();
    if (!editingProjectId || !trimmedName || isUpdatingProjects) return;

    const duplicatedName = projects.some(
      (project) =>
        project.id !== editingProjectId &&
        project.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicatedName) return;

    setIsUpdatingProjects(true);
    const updatedProject = await updateProject(editingProjectId, {
      name: trimmedName,
      color: editingProjectColor,
    });
    setIsUpdatingProjects(false);
    if (!updatedProject) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === editingProjectId
          ? updatedProject
          : project
      )
    );
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Project Timers</h3>
          <p className="text-sm text-slate-500">
            Tap a project to start/stop logging. Stopping automatically saves a task.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            disabled={isProjectsLoading || isUpdatingProjects}
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsAdding((prev) => !prev)}
            disabled={isProjectsLoading || isUpdatingProjects}
          >
            <Plus className="h-4 w-4" />
            Project
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1 space-y-1">
              <Label htmlFor="newProjectName">Project name</Label>
              <Input
                id="newProjectName"
                placeholder="New project"
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                disabled={isUpdatingProjects}
              />
            </div>
            <div className="w-24 space-y-1">
              <Label htmlFor="newProjectColor">Color</Label>
              <Input
                id="newProjectColor"
                type="color"
                value={newProjectColor}
                onChange={(event) => setNewProjectColor(event.target.value)}
                className="h-10 p-1"
                disabled={isUpdatingProjects}
              />
            </div>
            <Button type="button" onClick={handleAddProject} disabled={isUpdatingProjects}>
              Add
            </Button>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_130px_auto] md:items-end">
            <div className="space-y-1">
              <Label htmlFor="editProjectSelect">Project</Label>
              <Select value={editingProjectId} onValueChange={handleSelectProjectForSettings}>
                <SelectTrigger id="editProjectSelect" disabled={isUpdatingProjects}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="editProjectName">Rename</Label>
              <Input
                id="editProjectName"
                value={editingProjectName}
                onChange={(event) => setEditingProjectName(event.target.value)}
                placeholder="Project name"
                disabled={isUpdatingProjects}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editProjectColor">Color</Label>
              <Input
                id="editProjectColor"
                type="color"
                value={editingProjectColor}
                onChange={(event) => setEditingProjectColor(event.target.value)}
                className="h-10 p-1"
                disabled={isUpdatingProjects}
              />
            </div>
            <Button
              type="button"
              onClick={handleSaveProjectSettings}
              disabled={!editingProjectId || isUpdatingProjects}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {projects.map((project) => {
          const isActive = activeSession?.projectId === project.id;
          const elapsedLabel = isActive && activeSession ? formatElapsed(getElapsedSeconds(activeSession)) : undefined;

          return (
            <div key={project.id} className="min-w-40 flex-1 basis-[calc(33.333%-0.75rem)]">
              <ProjectTimerButton
                name={project.name}
                color={project.color}
                isActive={isActive}
                elapsedLabel={elapsedLabel}
                onClick={() => handleProjectClick(project)}
              />
            </div>
          );
        })}
      </div>

      {isProjectsLoading && (
        <p className="mt-4 text-sm text-slate-500">Loading projects...</p>
      )}

      {!isProjectsLoading && !projects.length && (
        <p className="mt-4 text-sm text-slate-500">
          No projects yet. Click <span className="font-medium">Project</span> to add one.
        </p>
      )}

      {activeProject && activeSession && (
        <p className="mt-3 text-lg font-mono font-bold text-slate-800">
          Active: <span className="font-semibold">{activeProject.name}</span>{' '}
          ({formatElapsed(getElapsedSeconds(activeSession))})
        </p>
      )}
    </div>
  );
}
