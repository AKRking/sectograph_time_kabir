/*
  # Create project_timer_state table for cross-device active timer sync

  1. New Tables
    - `project_timer_state`
      - `id` (integer, primary key; single-row key set to 1)
      - `project_id` (uuid, references projects.id)
      - `started_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `project_timer_state` table
    - Add policies for public read and write
*/

CREATE TABLE IF NOT EXISTS project_timer_state (
  id integer PRIMARY KEY CHECK (id = 1),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_timer_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read project timer state"
  ON project_timer_state
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert project timer state"
  ON project_timer_state
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update project timer state"
  ON project_timer_state
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete project timer state"
  ON project_timer_state
  FOR DELETE
  TO public
  USING (true);
