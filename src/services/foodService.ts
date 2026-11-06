import { supabase } from '../lib/supabase';
import { FoodEntry, FoodEntryInput } from '../types';

export async function listEntriesForDate(date: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('entry_date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as FoodEntry[];
}

export async function listEntriesInRange(from: string, to: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: false });
  if (error) throw error;
  return data as FoodEntry[];
}

export async function getEntry(id: string): Promise<FoodEntry> {
  const { data, error } = await supabase.from('food_entries').select('*').eq('id', id).single();
  if (error) throw error;
  return data as FoodEntry;
}

export async function addEntry(userId: string, input: FoodEntryInput): Promise<void> {
  const { error } = await supabase.from('food_entries').insert({ user_id: userId, ...input });
  if (error) throw error;
}

export async function updateEntry(id: string, input: FoodEntryInput): Promise<void> {
  const { error } = await supabase.from('food_entries').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  if (error) throw error;
}
