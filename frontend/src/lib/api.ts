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
