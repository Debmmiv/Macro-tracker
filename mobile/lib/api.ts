import * as SecureStore from 'expo-secure-store';

// ─── Configuration ────────────────────────────────────────────────────────────
//
// Change this to your PC's LAN IP when testing on a physical device.
// e.g. "http://192.168.1.100:8000"
// For Android emulator use: "http://10.0.2.2:8000"
//
const API_URL = 'http://192.168.1.2:8000';

// ─── Token storage (uses SecureStore instead of localStorage) ────────────────

const TOKEN_KEY = 'authToken';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(
  username: string,
  email: string,
  password: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const firstError = Object.values(data)[0];
    const message = Array.isArray(firstError)
      ? firstError[0]
      : "Couldn't create your account.";
    throw new Error(message as string);
  }
}

export async function login(
  username: string,
  password: string
): Promise<string> {
  const res = await fetch(`${API_URL}/api-token-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid username or password.');
  const data = await res.json();
  return data.token as string;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function authedGet(path: string) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status === 401) { await clearToken(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function authedPost(path: string, body: unknown) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { await clearToken(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function authedDelete(path: string): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status === 401) { await clearToken(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

async function authedPatch(path: string, body: unknown) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { await clearToken(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ─── Types & API calls ────────────────────────────────────────────────────────

export interface DailySummary {
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { daily_calorie_target: number | null; daily_protein_target_g: number | null };
}

export interface WeightEntry {
  id: number;
  weight_kg: number;
  date: string;
}

export interface Food {
  id: number;
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface TodayLogEntry {
  id: number;
  servings: number;
  date: string;
  food: number;
  food_detail: Food;
}

export interface ExternalFood {
  fdc_id: number;
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Profile {
  target_weight_kg: number | null;
  daily_calorie_target: number | null;
  daily_protein_target_g: number | null;
  height_cm: number | null;
  age: number | null;
  sex: 'male' | 'female' | 'other' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete' | null;
}

export const getDailySummary = (): Promise<DailySummary> => authedGet('/api/logs/summary/');
export const getWeights = (): Promise<WeightEntry[]> => authedGet('/api/weights/');
export const getTodayLogs = (): Promise<TodayLogEntry[]> => authedGet('/api/logs/today/');
export const deleteLog = (logId: number): Promise<void> => authedDelete(`/api/logs/${logId}/`);
export const searchFoods = (query: string): Promise<Food[]> =>
  query.trim() ? authedGet(`/api/foods/?search=${encodeURIComponent(query)}`) : Promise.resolve([]);
export const searchExternalFoods = (query: string): Promise<ExternalFood[]> =>
  query.trim() ? authedGet(`/api/foods/external-search/?q=${encodeURIComponent(query)}`) : Promise.resolve([]);
export const createFood = (food: Omit<Food, 'id'>): Promise<Food> => authedPost('/api/foods/', food);
export const logFood = (foodId: number, servings: number): Promise<unknown> =>
  authedPost('/api/logs/', { food: foodId, servings });
export const getProfile = (): Promise<Profile> => authedGet('/api/profile/');
export const updateProfile = (data: Partial<Profile>): Promise<Profile> => authedPatch('/api/profile/', data);
export const logWeight = (weight_kg: number): Promise<WeightEntry> => authedPost('/api/weights/', { weight_kg });
