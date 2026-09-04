const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function register(username: string, email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // DRF returns errors shaped like { "fieldname": ["message"] } - grab the first one
    const firstError = Object.values(data)[0];
    const message = Array.isArray(firstError) ? firstError[0] : "Couldn't create your account.";
    throw new Error(message as string);
  }
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid username or password.");
  }

  const data = await res.json();
  return data.token as string;
}

export function saveToken(token: string) {
  localStorage.setItem("authToken", token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function clearToken() {
  localStorage.removeItem("authToken");
}

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

async function authedGet(path: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  return res.json();
}

async function authedPost(path: string, body: unknown) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  return res.json();
}

async function authedDelete(path: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Token ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

async function authedPatch(path: string, body: unknown) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  return res.json();
}

export function getDailySummary(): Promise<DailySummary> {
  return authedGet("/api/logs/summary/");
}

export function getWeights(): Promise<WeightEntry[]> {
  return authedGet("/api/weights/");
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

export function getTodayLogs(): Promise<TodayLogEntry[]> {
  return authedGet("/api/logs/today/");
}

export function deleteLog(logId: number): Promise<void> {
  return authedDelete(`/api/logs/${logId}/`);
}

export function searchFoods(query: string): Promise<Food[]> {
  if (!query.trim()) return Promise.resolve([]);
  return authedGet(`/api/foods/?search=${encodeURIComponent(query)}`);
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

export function searchExternalFoods(query: string): Promise<ExternalFood[]> {
  if (!query.trim()) return Promise.resolve([]);
  return authedGet(`/api/foods/external-search/?q=${encodeURIComponent(query)}`);
}

export function createFood(food: Omit<Food, "id">): Promise<Food> {
  return authedPost("/api/foods/", food);
}

export function logFood(foodId: number, servings: number): Promise<unknown> {
  return authedPost("/api/logs/", { food: foodId, servings });
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

export function getProfile(): Promise<Profile> {
  return authedGet("/api/profile/");
}

export function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return authedPatch("/api/profile/", data);
}

export function logWeight(weight_kg: number): Promise<WeightEntry> {
  return authedPost("/api/weights/", { weight_kg });
}