export type Gender = 'male' | 'female' | 'other';
export type FitnessGoal = 'lose_weight' | 'maintain_weight' | 'build_muscle';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: FitnessGoal | null;
  activity_level: ActivityLevel | null;
  bmi: number | null;
  bmr: number | null;
  tdee: number | null;
  daily_calorie_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  onboarding_completed: boolean;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id'>>;

export interface FoodEntry {
  id: string;
  user_id: string;
  food_name: string;
  serving_size: string | null;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  meal_type: MealType;
  entry_date: string; // YYYY-MM-DD
}

export type FoodEntryInput = Omit<FoodEntry, 'id' | 'user_id'>;

export interface Totals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
