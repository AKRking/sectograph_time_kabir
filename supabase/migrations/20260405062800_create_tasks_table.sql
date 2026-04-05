/*
  # Create tasks table for Sectograph time management app

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, task name)
      - `start_time` (integer, minutes from 0-1439)
      - `end_time` (integer, minutes from 0-1439)
      - `color` (text, hex color code for arc)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for public read access
    - Add policy for public create/update/delete
    - Note: This is a client-side only app with no authentication, so public access is appropriate
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_time integer NOT NULL CHECK (start_time >= 0 AND start_time < 1440),
  end_time integer NOT NULL CHECK (end_time >= 0 AND end_time < 1440),
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON tasks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert"
  ON tasks
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON tasks
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete"
  ON tasks
  FOR DELETE
  TO public
  USING (true);