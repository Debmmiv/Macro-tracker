const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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

export function getDailySummary(): Promise<DailySummary> {
  return authedGet("/api/logs/summary/");
}

export function getWeights(): Promise<WeightEntry[]> {
  return authedGet("/api/weights/");
}