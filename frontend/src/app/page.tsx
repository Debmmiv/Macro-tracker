"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken, getDailySummary, getWeights, DailySummary, WeightEntry } from "@/lib/api";

function ProgressRing({ label, value, target, unit, color }: { label: string; value: number; target: number | null; unit: string; color: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#E7E2D6" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-[#1C2B1E]">{Math.round(value)}</span>
          <span className="text-[10px] text-[#5B6B5D]">{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-[#1C2B1E]">{label}</span>
      <span className="text-xs text-[#5B6B5D]">
        {target ? `of ${target}${unit}` : "no target set"}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    Promise.all([getDailySummary(), getWeights()])
      .then(([summaryData, weights]) => {
        setSummary(summaryData);
        setLatestWeight(weights[0] ?? null);
      })
      .catch(() => {
        setError("Couldn't load your data. Try logging in again.");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F3EC] flex items-center justify-center">
        <p className="text-[#5B6B5D]">Loading...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen bg-[#F6F3EC] flex items-center justify-center">
        <p className="text-[#B3401E]">{error ?? "Something went wrong."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F3EC] pb-24">
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[#5B6B5D]">Today</p>
            <h1 className="text-xl font-semibold text-[#1C2B1E]">{summary.date}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[#5B6B5D] hover:text-[#1C2B1E] underline"
          >
            Log out
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-6 flex justify-around">
          <ProgressRing
            label="Calories"
            value={summary.totals.calories}
            target={summary.targets.daily_calorie_target}
            unit=""
            color="#E8A854"
          />
          <ProgressRing
            label="Protein"
            value={summary.totals.protein}
            target={summary.targets.daily_protein_target_g}
            unit="g"
            color="#2F5233"
          />
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#5B6B5D]">Carbs</p>
            <p className="text-lg font-semibold text-[#1C2B1E]">{Math.round(summary.totals.carbs)}g</p>
          </div>
          <div>
            <p className="text-xs text-[#5B6B5D]">Fat</p>
            <p className="text-lg font-semibold text-[#1C2B1E]">{Math.round(summary.totals.fat)}g</p>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5">
          <p className="text-xs text-[#5B6B5D] mb-1">Latest weight</p>
          {latestWeight ? (
            <p className="text-lg font-semibold text-[#1C2B1E]">
              {latestWeight.weight_kg}kg <span className="text-xs font-normal text-[#5B6B5D]">on {latestWeight.date}</span>
            </p>
          ) : (
            <p className="text-sm text-[#5B6B5D]">No weight logged yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
