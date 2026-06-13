import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAuthenticatedUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

/**
 * Wrapper for Supabase insert that automatically attaches the current user_id.
 */
export const insertAuthenticated = async (table: string, data: any) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("No authenticated user found");
  
  return supabase.from(table).insert({ ...data, user_id: userId });
};
