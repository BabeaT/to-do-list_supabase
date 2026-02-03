import { createClient } from './client';

export const supabase = createClient();

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
};