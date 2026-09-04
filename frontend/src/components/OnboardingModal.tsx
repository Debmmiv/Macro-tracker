"use client";

import { useState, useEffect, FormEvent } from "react";
import { updateProfile, logWeight, Profile } from "@/lib/api";

// ─── Constants (mirrors profile page) ─────────────────────────────────────────

const ACTIVITY_OPTIONS = [
  { id: "sedentary", label: "Sedentary",         desc: "Desk job, little/no exercise" },
  { id: "light",     label: "Lightly active",    desc: "1–3 days/week exercise" },
  { id: "moderate",  label: "Moderately active", desc: "3–5 days/week exercise" },
  { id: "active",    label: "Very active",       desc: "6–7 days/week exercise" },
  { id: "athlete",   label: "Athlete",           desc: "Training twice daily" },
] as const;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.20, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.90,
};

const DIET_OPTIONS = [
  { id: "cut",         emoji: "🔥", label: "Cut",          desc: "Lose fat — 20% caloric deficit",        calFactor: 0.80, proteinFactor: 2.2 },
  { id: "maintain",    emoji: "⚖️", label: "Maintain",     desc: "Hold your weight and composition",      calFactor: 1.00, proteinFactor: 1.8 },
  { id: "bulk",        emoji: "💪", label: "Bulk",         desc: "Build muscle — 10% caloric surplus",    calFactor: 1.10, proteinFactor: 2.0 },
  { id: "keto",        emoji: "🥑", label: "Keto",         desc: "Very low carb, fat-fuelled approach",   calFactor: 0.85, proteinFactor: 1.6 },
  { id: "highprotein", emoji: "🥩", label: "High Protein", desc: "Max muscle retention and satiety",      calFactor: 1.00, proteinFactor: 2.8 },
  { id: "custom",      emoji: "✏️", label: "Custom",       desc: "Set your own calorie & protein goals",  calFactor: null,  proteinFactor: null },
];

// ─── Calculation helpers ───────────────────────────────────────────────────────

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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState(1); // 1 = body, 2 = activity, 3 = goal, 4 = done
  const TOTAL_STEPS = 3;

  // Step 1 — Body
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge]       = useState("");
  const [sex, setSex]       = useState("");

  // Step 2 — Activity
  const [activity, setActivity] = useState("");

  // Step 3 — Diet / Goal
  const [dietType, setDietType]           = useState<string | null>(null);
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein]   = useState("");

  // Derived
  const w   = parseFloat(weight);
  const h   = parseFloat(height);
  const bmi = w && h ? calcBMI(w, h) : null;
  const bmiDisplay = bmi ? bmiInfo(bmi) : null;

  const [recommendation, setRecommendation] = useState<{ calories: number; protein: number } | null>(null);

  useEffect(() => {
    if (!dietType || dietType === "custom") { setRecommendation(null); return; }
    const a = parseInt(age, 10);
    if (!w || !h || !a || !sex || !activity) { setRecommendation(null); return; }
    const diet = DIET_OPTIONS.find((d) => d.id === dietType);
    if (!diet?.calFactor) { setRecommendation(null); return; }
    const tdee = calcTDEE(w, h, a, sex, activity);
    setRecommendation({
      calories: Math.round((tdee * diet.calFactor) / 50) * 50,
      protein:  Math.round(w * diet.proteinFactor!),
    });
  }, [weight, height, age, sex, activity, dietType]);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // ── Step 1 validation ──
  const step1Valid = height.trim() !== "" && weight.trim() !== "" && age.trim() !== "" && sex !== "";

  // ── Step 2 validation ──
  const step2Valid = activity !== "";

  // ── Step 3 ──
  const appliedCalories = dietType === "custom"
    ? (customCalories ? Number(customCalories) : null)
    : recommendation?.calories ?? null;

  const appliedProtein = dietType === "custom"
    ? (customProtein ? Number(customProtein) : null)
    : recommendation?.protein ?? null;

  const step3Valid = dietType !== null && (
    dietType !== "custom" ? recommendation !== null : (customCalories.trim() !== "" && customProtein.trim() !== "")
  );

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Profile> = {
        height_cm:              h || null,
        age:                    parseInt(age, 10) || null,
        sex:                    (sex || null) as Profile["sex"],
        activity_level:         (activity || null) as Profile["activity_level"],
        daily_calorie_target:   appliedCalories,
        daily_protein_target_g: appliedProtein,
      };
      await updateProfile(payload);

      // Also log the current weight so the weight trend starts immediately
      if (w) await logWeight(w);

      onComplete();
    } catch {
      setError("Couldn't save your settings. You can update them later in Profile.");
      setSaving(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set up your profile"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      >
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* ── Header ── */}
          <div className="bg-[#2F5233] px-6 pt-7 pb-5 flex-shrink-0">
            {/* Progress bar */}
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i < step ? "bg-[#E8A854]" : "bg-white/30"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-[#E8A854] mb-1">
              Step {step} of {TOTAL_STEPS}
            </p>
            <h2 className="text-xl font-bold text-white">
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "How active are you?"}
              {step === 3 && "Choose your goal"}
            </h2>
            <p className="text-sm text-white/70 mt-0.5">
              {step === 1 && "We'll use this to calculate your personalised targets."}
              {step === 2 && "Affects how many calories you burn each day."}
              {step === 3 && "We'll recommend daily calorie & protein targets."}
            </p>
          </div>

          {/* ── Body (scrollable) ── */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

            {/* ════ STEP 1 — BODY ════ */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {/* Height */}
                  <div>
                    <label htmlFor="ob-height" className="block text-xs font-semibold text-[#1C2B1E] mb-1">
                      Height
                    </label>
                    <div className="relative">
                      <input
                        id="ob-height" type="number" min="100" max="250" step="0.5" placeholder="175"
                        value={height} onChange={(e) => setHeight(e.target.value)}
                        className="w-full rounded-xl border border-[#DDD7C7] px-3 py-2.5 pr-9 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9A9484]">cm</span>
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label htmlFor="ob-weight" className="block text-xs font-semibold text-[#1C2B1E] mb-1">
                      Current weight
                    </label>
                    <div className="relative">
                      <input
                        id="ob-weight" type="number" min="20" max="300" step="0.1" placeholder="80"
                        value={weight} onChange={(e) => setWeight(e.target.value)}
                        className="w-full rounded-xl border border-[#DDD7C7] px-3 py-2.5 pr-9 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9A9484]">kg</span>
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label htmlFor="ob-age" className="block text-xs font-semibold text-[#1C2B1E] mb-1">
                      Age
                    </label>
                    <input
                      id="ob-age" type="number" min="10" max="110" placeholder="28"
                      value={age} onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-xl border border-[#DDD7C7] px-3 py-2.5 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233]"
                    />
                  </div>

                  {/* Sex */}
                  <div>
                    <p className="text-xs font-semibold text-[#1C2B1E] mb-1">Sex</p>
                    <div className="flex gap-1">
                      {(["male", "female", "other"] as const).map((s) => (
                        <button
                          key={s} type="button"
                          onClick={() => setSex(s)}
                          className={`flex-1 rounded-xl py-2.5 text-xs font-medium border transition-colors capitalize
                            ${sex === s
                              ? "bg-[#2F5233] text-white border-[#2F5233]"
                              : "bg-white text-[#5B6B5D] border-[#DDD7C7] hover:border-[#2F5233]"}`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live BMI badge */}
                {bmi && bmiDisplay && (
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-3 border"
                    style={{ backgroundColor: bmiDisplay.color + "15", borderColor: bmiDisplay.color + "40" }}
                  >
                    <span className="text-sm text-[#1C2B1E] font-medium">Your BMI</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-[#1C2B1E]">{bmi.toFixed(1)}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: bmiDisplay.color }}
                      >
                        {bmiDisplay.label}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ════ STEP 2 — ACTIVITY ════ */}
            {step === 2 && (
              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id} type="button"
                    onClick={() => setActivity(opt.id)}
                    className={`w-full text-left rounded-2xl px-4 py-3.5 border transition-all
                      ${activity === opt.id
                        ? "bg-[#EEF4EE] border-[#2F5233] shadow-sm"
                        : "bg-[#FAFAF8] border-[#E7E2D6] hover:border-[#B8CDB9]"}`}
                  >
                    <p className={`text-sm font-semibold ${activity === opt.id ? "text-[#2F5233]" : "text-[#1C2B1E]"}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-[#9A9484] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ════ STEP 3 — DIET / GOAL ════ */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {DIET_OPTIONS.map((d) => (
                    <button
                      key={d.id} type="button"
                      onClick={() => setDietType(d.id)}
                      className={`rounded-2xl border p-3 text-left transition-all
                        ${dietType === d.id
                          ? "bg-[#EEF4EE] border-[#2F5233] shadow-sm"
                          : "bg-[#FAFAF8] border-[#E7E2D6] hover:border-[#B8CDB9]"}`}
                    >
                      <span className="text-2xl">{d.emoji}</span>
                      <p className={`text-sm font-semibold mt-1 ${dietType === d.id ? "text-[#2F5233]" : "text-[#1C2B1E]"}`}>
                        {d.label}
                      </p>
                      <p className="text-[11px] text-[#9A9484] mt-0.5 leading-snug">{d.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Recommendation card */}
                {recommendation && dietType !== "custom" && (
                  <div className="bg-[#EEF4EE] rounded-2xl border border-[#2F5233] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#2F5233] mb-3">
                      Recommended for you
                    </p>
                    <div className="flex justify-around">
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
                  </div>
                )}

                {/* Custom inputs */}
                {dietType === "custom" && (
                  <div className="space-y-3 bg-[#FAFAF8] rounded-2xl border border-[#E7E2D6] p-4">
                    <p className="text-xs font-semibold text-[#1C2B1E]">Your custom targets</p>
                    <div>
                      <label htmlFor="ob-custom-cal" className="block text-xs text-[#5B6B5D] mb-1">Calories (kcal)</label>
                      <input
                        id="ob-custom-cal" type="number" min="0" step="50" placeholder="e.g. 2000"
                        value={customCalories} onChange={(e) => setCustomCalories(e.target.value)}
                        className="w-full rounded-xl border border-[#DDD7C7] px-3 py-2 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233]"
                      />
                    </div>
                    <div>
                      <label htmlFor="ob-custom-prot" className="block text-xs text-[#5B6B5D] mb-1">Protein (g)</label>
                      <input
                        id="ob-custom-prot" type="number" min="0" step="5" placeholder="e.g. 150"
                        value={customProtein} onChange={(e) => setCustomProtein(e.target.value)}
                        className="w-full rounded-xl border border-[#DDD7C7] px-3 py-2 text-sm text-[#1C2B1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5233]"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="text-sm text-[#B3401E] text-center">{error}</p>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 pb-5 pt-3 flex-shrink-0 space-y-2 border-t border-[#F0EBE1]">
            {step < TOTAL_STEPS ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !step1Valid) ||
                    (step === 2 && !step2Valid)
                  }
                  className="w-full rounded-2xl bg-[#2F5233] text-white font-semibold py-3 hover:bg-[#274529] transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="w-full text-sm text-[#5B6B5D] hover:text-[#1C2B1E] py-1 transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!step3Valid || saving}
                  className="w-full rounded-2xl bg-[#2F5233] text-white font-semibold py-3 hover:bg-[#274529] transition-colors disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Let's go! 🎉"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="w-full text-sm text-[#5B6B5D] hover:text-[#1C2B1E] py-1 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full text-xs text-[#9A9484] hover:text-[#5B6B5D] py-0.5 transition-colors"
                >
                  Skip for now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
