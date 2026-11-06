import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Field } from '../src/components/Field';
import { Chips } from '../src/components/Chips';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { TargetsEditor, TargetStrings, validateTargets } from '../src/components/TargetsEditor';
import { useSession } from '../src/context/SessionContext';
import { ACTIVITY_LEVELS, GENDERS, GOALS } from '../src/utils/constants';
import { bmiCategory, calculateAll, CalculationResult } from '../src/utils/calculations';
import { ActivityLevel, FitnessGoal, Gender } from '../src/types';
import { colors, type } from '../src/theme';

export default function Onboarding() {
  const { profile, updateProfile, signOut } = useSession();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calc, setCalc] = useState<CalculationResult | null>(null);
  const [targets, setTargets] = useState<TargetStrings>({ calories: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter your name';
    const a = Number(age);
    if (!Number.isInteger(a) || a < 13 || a > 100) e.age = 'Enter an age from 13 to 100';
    if (!gender) e.gender = 'Choose one';
    const h = Number(height.replace(',', '.'));
    if (!h || h < 100 || h > 250) e.height = 'Between 100 and 250 cm';
    const w = Number(weight.replace(',', '.'));
    if (!w || w < 30 || w > 300) e.weight = 'Between 30 and 300 kg';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToResults = () => {
    if (!goal || !activity) {
      setErrors({ fitness: 'Choose a goal and an activity level.' });
      return;
    }
    setErrors({});
    const result = calculateAll({
      gender: gender!,
      age: Number(age),
      height_cm: Number(height.replace(',', '.')),
      weight_kg: Number(weight.replace(',', '.')),
      activity_level: activity,
      fitness_goal: goal,
    });
    setCalc(result);
    setTargets({
      calories: String(result.targets.calories),
      protein: String(result.targets.protein),
      carbs: String(result.targets.carbs),
      fat: String(result.targets.fat),
    });
    setStep(3);
  };

  const finish = async () => {
    const problem = validateTargets(targets);
    if (problem) return Alert.alert('Check your targets', problem);
    if (!calc) return;
    setBusy(true);
    try {
      await updateProfile({
        full_name: name.trim(),
        age: Number(age),
        gender,
        height_cm: Number(height.replace(',', '.')),
        weight_kg: Number(weight.replace(',', '.')),
        fitness_goal: goal,
        activity_level: activity,
        bmi: calc.bmi,
        bmr: calc.bmr,
        tdee: calc.tdee,
        daily_calorie_target: Number(targets.calories),
        protein_target: Number(targets.protein),
        carbs_target: Number(targets.carbs),
        fat_target: Number(targets.fat),
        onboarding_completed: true,
      });
      // The root layout redirects to the dashboard once the profile is marked complete.
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ paddingTop: 24 }}>
      <Text style={type.small}>Step {step} of 3</Text>

      {step === 1 && (
        <>
          <Text style={type.title}>About you</Text>
          <View style={{ flexDirection: 'row' }}>
            <Field label="Full name" value={name} onChangeText={setName} error={errors.name} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field label="Age" keyboardType="number-pad" value={age} onChangeText={setAge} error={errors.age} />
            <Field label="Height" suffix="cm" keyboardType="decimal-pad" value={height} onChangeText={setHeight} error={errors.height} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Field label="Current weight" suffix="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} error={errors.weight} />
          </View>
          <Chips label="Gender" options={GENDERS} value={gender} onChange={setGender} />
          {errors.gender ? <Text style={{ color: colors.danger, fontSize: 12 }}>{errors.gender}</Text> : null}
          <Button title="Continue" onPress={() => validateStep1() && setStep(2)} />
          <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={type.title}>Your goal</Text>
          <Chips label="Fitness goal" options={GOALS} value={goal} onChange={setGoal} />
          <Chips label="Activity level" options={ACTIVITY_LEVELS} value={activity} onChange={setActivity} stacked />
          {errors.fitness ? <Text style={{ color: colors.danger }}>{errors.fitness}</Text> : null}
          <Button title="Calculate my targets" onPress={goToResults} />
          <Button title="Back" variant="secondary" onPress={() => setStep(1)} />
        </>
      )}

      {step === 3 && calc && (
        <>
          <Text style={type.title}>Your daily targets</Text>
          <Card>
            <Row label="BMI" value={`${calc.bmi} (${bmiCategory(calc.bmi)})`} />
            <Row label="BMR" value={`${calc.bmr.toLocaleString()} kcal`} />
            <Row label="TDEE" value={`${calc.tdee.toLocaleString()} kcal`} />
            <Text style={type.small}>
              BMI is a general screening number. It doesn't account for muscle, body build or overall health.
            </Text>
          </Card>
          <Text style={type.heading}>Review and adjust</Text>
          <Text style={type.small}>These are estimates. Change any value to fit your needs.</Text>
          <TargetsEditor value={targets} onChange={setTargets} />
          <Button title="Save and start tracking" onPress={finish} loading={busy} />
          <Button title="Back" variant="secondary" onPress={() => setStep(2)} />
        </>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={type.small}>{label}</Text>
      <Text style={[type.body, { fontWeight: '600', flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}
