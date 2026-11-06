import { ActivityLevel, FitnessGoal, Gender, Targets, Totals } from '../types';

export interface BodyInput {
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  fitness_goal: FitnessGoal;
}

export interface CalculationResult {
  bmi: number;
  bmr: number;
  tdee: number;
  targets: Targets;
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

// Daily calorie adjustment relative to TDEE
const GOAL_ADJUSTMENT: Record<FitnessGoal, number> = {
  lose_weight: -500,
  maintain_weight: 0,
  build_muscle: 300,
};

// Protein grams per kg of body weight
const PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  lose_weight: 2.0,
  maintain_weight: 1.6,
  build_muscle: 1.8,
};

// Share of calories from fat
const FAT_SHARE: Record<FitnessGoal, number> = {
  lose_weight: 0.25,
  maintain_weight: 0.3,
  build_muscle: 0.25,
};

const MIN_CALORIES = 1200;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function calcBMI(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
}

/** General screening range only. It is not a diagnosis or a full health assessment. */
export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Below the typical range';
  if (bmi < 25) return 'Within the typical range';
  if (bmi < 30) return 'Above the typical range';
  return 'Well above the typical range';
}

/** Mifflin-St Jeor equation */
export function calcBMR(input: Pick<BodyInput, 'gender' | 'age' | 'height_cm' | 'weight_kg'>): number {
  const base = 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age;
  const offset = input.gender === 'male' ? 5 : input.gender === 'female' ? -161 : -78; // 'other' = midpoint
  return Math.round(base + offset);
}

export function calcTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
}

export function calcTargets(tdee: number, input: Pick<BodyInput, 'fitness_goal' | 'weight_kg'>): Targets {
  const calories = Math.max(MIN_CALORIES, Math.round((tdee + GOAL_ADJUSTMENT[input.fitness_goal]) / 10) * 10);
  const protein = Math.round(input.weight_kg * PROTEIN_PER_KG[input.fitness_goal]);
  const fat = Math.round((calories * FAT_SHARE[input.fitness_goal]) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

export function calculateAll(input: BodyInput): CalculationResult {
  const bmr = calcBMR(input);
  const tdee = calcTDEE(bmr, input.activity_level);
  return {
    bmi: calcBMI(input.weight_kg, input.height_cm),
    bmr,
    tdee,
    targets: calcTargets(tdee, input),
  };
}

export function sumTotals(entries: { calories: number; protein: number; carbohydrates: number; fat: number }[]): Totals {
  return entries.reduce<Totals>(
    (t, e) => ({
      calories: t.calories + Number(e.calories),
      protein: t.protein + Number(e.protein),
      carbohydrates: t.carbohydrates + Number(e.carbohydrates),
      fat: t.fat + Number(e.fat),
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );
}
