import { supabase } from '../lib/supabase';
import { Profile, ProfileUpdate } from '../types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** Upsert so it works even if the signup trigger has not created the row. */
export async function saveProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
