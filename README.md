# MacroTrack

Expo + React Native + TypeScript macro tracker backed by Supabase (Auth + Postgres + RLS).

## Setup
1. `npm install` then `npx expo install --fix` (aligns package versions with your Expo SDK).
2. Create a Supabase project. In the SQL Editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and fill in your project URL and **anon** key. Never put the service role key in the app.
4. Optional: in Supabase > Authentication > Providers > Email, turn off "Confirm email" while developing.
5. `npx expo start`, then press `a` (Android), `i` (iOS), or scan the QR code with Expo Go.

## Structure
- `app/` Expo Router screens: `(auth)` login/register, `onboarding`, `(tabs)` Home/Food Log/History/Profile, `food-form` (add/edit modal)
- `src/utils/calculations.ts` BMI, Mifflin-St Jeor BMR, TDEE, goal-based calorie and macro targets
- `src/services/` all Supabase queries
- `src/context/SessionContext.tsx` session + profile state, drives the redirect logic in `app/_layout.tsx`
- `src/components/` reusable UI

## How targets are calculated
- BMR: Mifflin-St Jeor. TDEE = BMR x activity multiplier (1.2 to 1.9).
- Calories: TDEE -500 (lose), +0 (maintain), +300 (build), never below 1,200.
- Protein: 2.0 / 1.6 / 1.8 g per kg. Fat: 25% / 30% / 25% of calories. Carbs: the remainder.
- Every value can be edited during onboarding and in Profile.
