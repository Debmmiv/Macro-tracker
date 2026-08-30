"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, saveToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await login(username, password);
      saveToken(token);
      router.push("/");
    } catch {
      setError("Couldn't log in. Check your username and password and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F3EC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#2F5233] mb-4">
            <span className="text-[#E8A854] text-xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1C2B1E]">Welcome back</h1>
          <p className="text-sm text-[#5B6B5D] mt-1">Log in to keep your streak going.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-6 space-y-4"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#1C2B1E] mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2.5 text-[#1C2B1E] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1C2B1E] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2.5 text-[#1C2B1E] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-[#B3401E]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2F5233] text-white font-medium py-2.5 hover:bg-[#274529] transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
