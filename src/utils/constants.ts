import { ActivityLevel, FitnessGoal, Gender, MealType } from '../types';

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const GOALS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
];

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', hint: 'Exercise 1–3 days a week' },
  { value: 'moderately_active', label: 'Moderately Active', hint: 'Exercise 3–5 days a week' },
  { value: 'very_active', label: 'Very Active', hint: 'Hard exercise 6–7 days a week' },
  { value: 'extremely_active', label: 'Extremely Active', hint: 'Physical job or twice-daily training' },
];

export const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

export const mealLabel = (m: MealType) => MEALS.find((x) => x.value === m)?.label ?? m;
