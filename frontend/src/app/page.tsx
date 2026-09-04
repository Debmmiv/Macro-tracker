"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getToken, clearToken, getDailySummary, getWeights, getTodayLogs,
  deleteLog, logWeight, DailySummary, WeightEntry, TodayLogEntry,
} from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import OnboardingModal from "@/components/OnboardingModal";

function ProgressRing({
  label, value, target, unit, color,
}: {
  label: string; value: number; target: number | null; unit: string; color: string;
}) {
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
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-[#1C2B1E]">{Math.round(value)}</span>
          <span className="text-[10px] text-[#5B6B5D]">{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-[#1C2B1E]">{label}</span>
      <span className="text-xs text-[#5B6B5D]">
        {target ? `${pct}% of ${target}${unit}` : "no target set"}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [todayLogs, setTodayLogs] = useState<TodayLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Weight logging inline form
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [weightMsg, setWeightMsg] = useState<string | null>(null);

  function loadDashboard() {
    return Promise.all([getDailySummary(), getWeights(), getTodayLogs()]).then(
      ([summaryData, weights, logs]) => {
        setSummary(summaryData);
        setLatestWeight(weights[0] ?? null);
        setTodayLogs(logs);
      }
    );
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    // Show onboarding modal for brand-new accounts
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboarding") === "1") {
      setShowOnboarding(true);
    }
    loadDashboard()
      .catch(() => {
        setError("Couldn't load your data. Try logging in again.");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    // Clear the ?onboarding param from the URL without a full navigation
    router.replace("/");
    // Reload dashboard so progress rings reflect the newly saved targets
    loadDashboard();
  }

  async function handleDeleteLog(logId: number) {
    try {
      await deleteLog(logId);
      await loadDashboard();
    } catch {
      setError("Couldn't remove that entry. Try again.");
    }
  }

  async function handleLogWeight(e: FormEvent) {
    e.preventDefault();
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    setLoggingWeight(true);
    try {
      await logWeight(kg);
      await loadDashboard();
      setWeightInput("");
      setShowWeightForm(false);
      setWeightMsg(`Logged ${kg}kg.`);
      setTimeout(() => setWeightMsg(null), 3000);
    } catch {
      setWeightMsg("Couldn't log weight. Try again.");
    } finally {
      setLoggingWeight(false);
    }
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
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
    <main className="min-h-screen bg-[#F6F3EC] pb-24">
      <div className="max-w-sm mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-[#5B6B5D]">Today</p>
          <h1 className="text-xl font-semibold text-[#1C2B1E]">{summary.date}</h1>
        </div>

        {/* Progress rings */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-6 flex justify-around">
          <ProgressRing
            label="Calories" value={summary.totals.calories}
            target={summary.targets.daily_calorie_target} unit="" color="#E8A854"
          />
          <ProgressRing
            label="Protein" value={summary.totals.protein}
            target={summary.targets.daily_protein_target_g} unit="g" color="#2F5233"
          />
        </div>

        {/* Carbs & Fat */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#5B6B5D]">Carbs</p>
            <p className="text-lg font-semibold text-[#1C2B1E]">{Math.round(summary.totals.carbs)}g</p>
          </div>
          <div>
            <p className="text-xs text-[#5B6B5D]">Fat</p>
            <p className="text-lg font-semibold text-[#1C2B1E]">{Math.round(summary.totals.fat)}g</p>
          </div>
        </div>

        {/* Today's food log */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5">
          <p className="text-xs text-[#5B6B5D] mb-3">Today&apos;s food</p>
          {todayLogs.length === 0 ? (
            <p className="text-sm text-[#5B6B5D]">Nothing logged yet today.</p>
          ) : (
            <div className="space-y-2">
              {todayLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1C2B1E] truncate">
                      {log.servings}× {log.food_detail.name}
                    </p>
                    <p className="text-xs text-[#5B6B5D]">
                      {Math.round(log.food_detail.calories * log.servings)} cal
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-xs text-[#B3401E] hover:underline shrink-0"
                    aria-label={`Remove ${log.food_detail.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-[#5B6B5D]">Latest weight</p>
            <button
              onClick={() => { setShowWeightForm((v) => !v); setWeightMsg(null); }}
              className="text-xs text-[#2F5233] font-medium hover:underline"
            >
              {showWeightForm ? "Cancel" : "+ Log weight"}
            </button>
          </div>

          {latestWeight ? (
            <p className="text-lg font-semibold text-[#1C2B1E]">
              {latestWeight.weight_kg}kg{" "}
              <span className="text-xs font-normal text-[#5B6B5D]">on {latestWeight.date}</span>
            </p>
          ) : (
            <p className="text-sm text-[#5B6B5D]">No weight logged yet.</p>
          )}

          {showWeightForm && (
            <form onSubmit={handleLogWeight} className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 75.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2 pr-8 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9A9484]">kg</span>
              </div>
              <button
                type="submit"
                disabled={loggingWeight}
                className="rounded-lg bg-[#2F5233] text-white text-sm font-medium px-3 py-2 hover:bg-[#274529] disabled:opacity-60"
              >
                {loggingWeight ? "…" : "Save"}
              </button>
            </form>
          )}

          {weightMsg && (
            <p className="mt-2 text-xs text-[#2F5233]">{weightMsg}</p>
          )}
        </div>
      </div>

      <BottomNav active="home" />
    </main>
    </>
  );
}
