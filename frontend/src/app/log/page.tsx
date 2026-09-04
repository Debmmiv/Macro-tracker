"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getToken, searchFoods, logFood, createFood, Food } from "@/lib/api";

export default function LogFoodPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showNewFoodForm, setShowNewFoodForm] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      searchFoods(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300); // debounce so we're not hitting the API on every keystroke

    return () => clearTimeout(timeout);
  }, [query]);

  async function handleLog(food: Food, servings: number) {
    setMessage(null);
    try {
      await logFood(food.id, servings);
      setMessage(`Logged ${servings}x ${food.name}.`);
      setQuery("");
      setResults([]);
    } catch {
      setMessage("Couldn't log that food. Try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F3EC] pb-24">
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#1C2B1E]">Log food</h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[#5B6B5D] hover:text-[#1C2B1E] underline"
          >
            Back to dashboard
          </button>
        </div>

        <input
          type="text"
          placeholder="Search for a food..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2.5 text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent mb-3"
        />

        {message && (
          <p className="text-sm text-[#2F5233] mb-3">{message}</p>
        )}

        {searching && <p className="text-sm text-[#5B6B5D]">Searching...</p>}

        {!searching && query.trim() && results.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-4 mb-3">
            <p className="text-sm text-[#5B6B5D] mb-2">No results for &quot;{query}&quot;.</p>
            <button
              onClick={() => setShowNewFoodForm(true)}
              className="text-sm text-[#2F5233] font-medium underline"
            >
              Add it as a new food
            </button>
          </div>
        )}

        <div className="space-y-2">
          {results.map((food) => (
            <FoodResultRow key={food.id} food={food} onLog={handleLog} />
          ))}
        </div>

        {!showNewFoodForm && (
          <button
            onClick={() => setShowNewFoodForm(true)}
            className="mt-4 text-sm text-[#5B6B5D] hover:text-[#1C2B1E] underline"
          >
            + Add a new food manually
          </button>
        )}

        {showNewFoodForm && (
          <NewFoodForm
            onCreated={(food) => {
              setShowNewFoodForm(false);
              setMessage(`Added ${food.name} to your foods.`);
            }}
            onCancel={() => setShowNewFoodForm(false)}
          />
        )}
      </div>
    </main>
  );
}

function FoodResultRow({ food, onLog }: { food: Food; onLog: (food: Food, servings: number) => void }) {
  const [servings, setServings] = useState("1");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E7E2D6] p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-[#1C2B1E] truncate">{food.name}</p>
        <p className="text-xs text-[#5B6B5D]">
          {food.serving_size} • {food.calories} cal • {food.protein}g protein
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          min="0.25"
          step="0.25"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className="w-14 rounded-md border border-[#DDD7C7] px-2 py-1 text-sm text-center"
        />
        <button
          onClick={() => onLog(food, parseFloat(servings) || 1)}
          className="rounded-md bg-[#2F5233] text-white text-sm font-medium px-3 py-1.5 hover:bg-[#274529]"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function NewFoodForm({ onCreated, onCancel }: { onCreated: (food: Food) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: "", serving_size: "", calories: "", protein: "", carbs: "", fat: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const food = await createFood({
        name: form.name,
        serving_size: form.serving_size,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
      });
      onCreated(food);
    } catch {
      setError("Couldn't save that food. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-4 space-y-3">
      <input
        placeholder="Food name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm"
      />
      <input
        placeholder="Serving size (e.g. 100g, 1 cup)"
        required
        value={form.serving_size}
        onChange={(e) => setForm({ ...form, serving_size: e.target.value })}
        className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Calories" type="number" required value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm" />
        <input placeholder="Protein (g)" type="number" step="0.1" required value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className="rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm" />
        <input placeholder="Carbs (g)" type="number" step="0.1" required value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm" />
        <input placeholder="Fat (g)" type="number" step="0.1" required value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} className="rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-sm text-[#B3401E]">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#2F5233] text-white text-sm font-medium py-2 hover:bg-[#274529] disabled:opacity-60">
          {saving ? "Saving..." : "Save food"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#DDD7C7] text-sm px-3 py-2 text-[#5B6B5D]">
          Cancel
        </button>
      </div>
    </form>
  );
}
