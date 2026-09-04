"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getToken, clearToken, getProfile, updateProfile, getWeights, Profile,
} from "@/lib/api";
import BottomNav from "@/components/BottomNav";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS = [
  { id: "sedentary", label: "Sedentary",          desc: "Desk job, little/no exercise" },
  { id: "light",     label: "Lightly active",     desc: "1–3 days/week exercise" },
  { id: "moderate",  label: "Moderately active",  desc: "3–5 days/week exercise" },
  { id: "active",    label: "Very active",        desc: "6–7 days/week exercise" },
  { id: "athlete",   label: "Athlete",            desc: "Training twice daily" },
] as const;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.20, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.90,
};

const DIET_OPTIONS = [
  { id: "cut",        emoji: "🔥", label: "Cut",         desc: "Lose fat with a 20% caloric deficit",       calFactor: 0.80, proteinFactor: 2.2 },
  { id: "maintain",   emoji: "⚖️", label: "Maintain",    desc: "Hold your current weight and composition",  calFactor: 1.00, proteinFactor: 1.8 },
  { id: "bulk",       emoji: "💪", label: "Bulk",        desc: "Build muscle with a 10% caloric surplus",   calFactor: 1.10, proteinFactor: 2.0 },
  { id: "keto",       emoji: "🥑", label: "Keto",        desc: "Very low carb, fat-fuelled approach",       calFactor: 0.85, proteinFactor: 1.6 },
  { id: "highprotein",emoji: "🥩", label: "High Protein",desc: "Max muscle retention and satiety",          calFactor: 1.00, proteinFactor: 2.8 },
  { id: "custom",     emoji: "✏️", label: "Custom",      desc: "Set your own calorie and protein goals",    calFactor: null,  proteinFactor: null },
];

// ─── Calculation helpers ──────────────────────────────────────────────────────

function calcBMI(weightKg: number, heightCm: number) {
  const hm = heightCm / 100;
  return weightKg / (hm * hm);
}

function bmiInfo(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#E8A854" };
  if (bmi < 25)   return { label: "Normal weight", color: "#2F5233" };
  if (bmi < 30)   return { label: "Overweight", color: "#E8A854" };
  return { label: "Obese", color: "#B3401E" };
}

function calcTDEE(weightKg: number, heightCm: number, age: number, sex: string, activity: string) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "male" ? base + 5 : sex === "female" ? base - 161 : base - 78;
  return bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.55);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  // Biometrics (server-persisted)
  const [bio, setBio] = useState({
    height_cm: "", age: "", sex: "", activity_level: "",
  });

  // Current weight — prefilled from latest WeightLog, used for calculations only
  const [currentWeight, setCurrentWeight] = useState("");

  // Diet selection
  const [dietType, setDietType] = useState<string | null>(null);

  // Recommended values (derived, not saved directly)
  const [recommendation, setRecommendation] = useState<{ calories: number; protein: number } | null>(null);

  // Targets (server-persisted)
  const [form, setForm] = useState({
    daily_calorie_target: "", daily_protein_target_g: "", target_weight_kg: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load profile + latest weight log ──
  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    Promise.all([getProfile(), getWeights()])
      .then(([p, weights]) => {
        setBio({
          height_cm:      p.height_cm?.toString()      ?? "",
          age:            p.age?.toString()             ?? "",
          sex:            p.sex                         ?? "",
          activity_level: p.activity_level              ?? "",
        });
        setForm({
          daily_calorie_target:  p.daily_calorie_target?.toString()  ?? "",
          daily_protein_target_g: p.daily_protein_target_g?.toString() ?? "",
          target_weight_kg:      p.target_weight_kg?.toString()      ?? "",
        });
        if (weights.length > 0) setCurrentWeight(weights[0].weight_kg.toString());
      })
      .catch(() => setError("Couldn't load your profile."))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Recalculate recommendation whenever inputs change ──
  useEffect(() => {
    if (!dietType || dietType === "custom") { setRecommendation(null); return; }

    const w   = parseFloat(currentWeight);
    const h   = parseFloat(bio.height_cm);
    const a   = parseInt(bio.age, 10);
    const s   = bio.sex;
    const act = bio.activity_level;
    if (!w || !h || !a || !s || !act) { setRecommendation(null); return; }

    const diet = DIET_OPTIONS.find((d) => d.id === dietType);
    if (!diet?.calFactor) { setRecommendation(null); return; }

    const tdee = calcTDEE(w, h, a, s, act);
    setRecommendation({
      calories: Math.round(tdee * diet.calFactor / 50) * 50, // round to nearest 50
      protein:  Math.round(w * diet.proteinFactor),
    });
  }, [currentWeight, bio, dietType]);

  function applyRecommendation() {
    if (!recommendation) return;
    setForm((f) => ({
      ...f,
      daily_calorie_target:  recommendation.calories.toString(),
      daily_protein_target_g: recommendation.protein.toString(),
    }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false); setSaving(true);
    try {
      await updateProfile({
        height_cm:             bio.height_cm     ? Number(bio.height_cm)     : null,
        age:                   bio.age           ? Number(bio.age)           : null,
        sex:                   (bio.sex || null) as Profile["sex"],
        activity_level:        (bio.activity_level || null) as Profile["activity_level"],
        daily_calorie_target:  form.daily_calorie_target  ? Number(form.daily_calorie_target)  : null,
        daily_protein_target_g: form.daily_protein_target_g ? Number(form.daily_protein_target_g) : null,
        target_weight_kg:      form.target_weight_kg      ? Number(form.target_weight_kg)      : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save your settings. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Derived BMI ──
  const w = parseFloat(currentWeight);
  const h = parseFloat(bio.height_cm);
  const bmi = w && h ? calcBMI(w, h) : null;
  const bmiDisplay = bmi ? bmiInfo(bmi) : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F3EC] flex items-center justify-center">
        <p className="text-[#5B6B5D]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F3EC] pb-28">
      <div className="max-w-sm mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#1C2B1E]">Profile &amp; Goals</h1>
          <button onClick={() => { clearToken(); router.push("/login"); }}
            className="text-sm text-[#5B6B5D] hover:text-[#1C2B1E] underline">
            Log out
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">

          {/* ── Section 1: Your Body ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6B5D]">Your body</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1C2B1E] mb-1">Height</label>
                <div className="relative">
                  <input id="height_cm" type="number" min="100" max="250" step="0.5" placeholder="e.g. 175"
                    value={bio.height_cm}
                    onChange={(e) => setBio({ ...bio, height_cm: e.target.value })}
                    className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2 pr-8 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9A9484]">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1C2B1E] mb-1">Current weight</label>
                <div className="relative">
                  <input id="current_weight" type="number" min="20" max="300" step="0.1" placeholder="e.g. 80"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2 pr-8 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9A9484]">kg</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1C2B1E] mb-1">Age</label>
                <input id="age" type="number" min="10" max="110" placeholder="e.g. 28"
                  value={bio.age}
                  onChange={(e) => setBio({ ...bio, age: e.target.value })}
                  className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1C2B1E] mb-1">Sex</label>
                <div className="flex gap-1">
                  {(["male", "female", "other"] as const).map((s) => (
                    <button key={s} type="button"
                      onClick={() => setBio({ ...bio, sex: s })}
                      className={`flex-1 rounded-lg py-2 text-xs font-medium border transition-colors capitalize
                        ${bio.sex === s
                          ? "bg-[#2F5233] text-white border-[#2F5233]"
                          : "bg-white text-[#5B6B5D] border-[#DDD7C7] hover:border-[#2F5233]"}`}>
                      {s === "other" ? "Other" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BMI badge */}
            {bmi && bmiDisplay && (
              <div className="flex items-center justify-between bg-[#F6F3EC] rounded-xl px-4 py-3">
                <span className="text-sm text-[#5B6B5D]">Your BMI</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1C2B1E]">{bmi.toFixed(1)}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: bmiDisplay.color }}>
                    {bmiDisplay.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Activity Level ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6B5D] mb-3">Activity level</p>
            {ACTIVITY_OPTIONS.map((opt) => (
              <button key={opt.id} type="button"
                onClick={() => setBio({ ...bio, activity_level: opt.id })}
                className={`w-full text-left rounded-xl px-4 py-3 border transition-colors
                  ${bio.activity_level === opt.id
                    ? "bg-[#EEF4EE] border-[#2F5233]"
                    : "bg-white border-[#E7E2D6] hover:border-[#B8CDB9]"}`}>
                <p className={`text-sm font-medium ${bio.activity_level === opt.id ? "text-[#2F5233]" : "text-[#1C2B1E]"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-[#9A9484] mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* ── Section 3: Diet Type ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6B5D] mb-3">Choose your goal</p>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map((d) => (
                <button key={d.id} type="button"
                  onClick={() => setDietType(d.id)}
                  className={`rounded-xl border p-3 text-left transition-all
                    ${dietType === d.id
                      ? "bg-[#EEF4EE] border-[#2F5233] shadow-sm"
                      : "bg-white border-[#E7E2D6] hover:border-[#B8CDB9]"}`}>
                  <span className="text-2xl">{d.emoji}</span>
                  <p className={`text-sm font-semibold mt-1 ${dietType === d.id ? "text-[#2F5233]" : "text-[#1C2B1E]"}`}>
                    {d.label}
                  </p>
                  <p className="text-[11px] text-[#9A9484] mt-0.5 leading-snug">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Section 4: Recommendation (auto-shown) ── */}
          {recommendation && dietType !== "custom" && (
            <div className="bg-[#EEF4EE] rounded-2xl border border-[#2F5233] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2F5233] mb-3">
                Recommended for you
              </p>
              <div className="flex justify-around mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1C2B1E]">{recommendation.calories}</p>
                  <p className="text-xs text-[#5B6B5D]">kcal / day</p>
                </div>
                <div className="w-px bg-[#C8DBC9]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1C2B1E]">{recommendation.protein}g</p>
                  <p className="text-xs text-[#5B6B5D]">protein / day</p>
                </div>
              </div>
              <button type="button" onClick={applyRecommendation}
                className="w-full rounded-xl bg-[#2F5233] text-white text-sm font-semibold py-2.5 hover:bg-[#274529] transition-colors">
                Apply these targets
              </button>
            </div>
          )}

          {/* ── Section 5: Targets ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E2D6] p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6B5D]">Daily targets</p>

            <div>
              <label htmlFor="calorie_target" className="block text-sm font-medium text-[#1C2B1E] mb-1">
                Calorie target
              </label>
              <div className="relative">
                <input id="calorie_target" type="number" min="0" step="50" placeholder="e.g. 2000"
                  value={form.daily_calorie_target}
                  onChange={(e) => setForm({ ...form, daily_calorie_target: e.target.value })}
                  className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2.5 pr-14 text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9484]">kcal</span>
              </div>
            </div>

            <div>
              <label htmlFor="protein_target" className="block text-sm font-medium text-[#1C2B1E] mb-1">
                Protein target
              </label>
              <div className="relative">
                <input id="protein_target" type="number" min="0" step="5" placeholder="e.g. 150"
                  value={form.daily_protein_target_g}
                  onChange={(e) => setForm({ ...form, daily_protein_target_g: e.target.value })}
                  className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2.5 pr-8 text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9484]">g</span>
              </div>
            </div>

            <div>
              <label htmlFor="target_weight" className="block text-sm font-medium text-[#1C2B1E] mb-1">
                Goal weight
              </label>
              <div className="relative">
                <input id="target_weight" type="number" min="0" step="0.5" placeholder="e.g. 75"
                  value={form.target_weight_kg}
                  onChange={(e) => setForm({ ...form, target_weight_kg: e.target.value })}
                  className="w-full rounded-lg border border-[#DDD7C7] px-3 py-2.5 pr-8 text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9484]">kg</span>
              </div>
            </div>
          </div>

          {error  && <p className="text-sm text-[#B3401E]">{error}</p>}
          {saved  && <p className="text-sm font-medium text-[#2F5233]">✓ Settings saved.</p>}

          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-[#2F5233] text-white font-semibold py-3 hover:bg-[#274529] transition-colors disabled:opacity-60">
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
