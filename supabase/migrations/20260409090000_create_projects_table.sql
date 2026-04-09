/*
  # Create projects table for project timer buttons

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, unique project name)
      - `color` (text, hex color code)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for public read and write
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#7f9cf5',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read projects"
  ON projects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert projects"
  ON projects
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update projects"
  ON projects
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete projects"
  ON projects
  FOR DELETE
  TO public
  USING (true);
