import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Field } from '../../src/components/Field';
import { Chips } from '../../src/components/Chips';
import { Button } from '../../src/components/Button';
import { TargetsEditor, TargetStrings, validateTargets } from '../../src/components/TargetsEditor';
import { useSession } from '../../src/context/SessionContext';
import { ACTIVITY_LEVELS, GOALS } from '../../src/utils/constants';
import { bmiCategory, calculateAll } from '../../src/utils/calculations';
import { ActivityLevel, FitnessGoal } from '../../src/types';
import { type } from '../../src/theme';

export default function ProfileScreen() {
  const { profile, updateProfile, signOut } = useSession();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [targets, setTargets] = useState<TargetStrings>({ calories: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setHeight(String(profile.height_cm ?? ''));
    setWeight(String(profile.weight_kg ?? ''));
    setGoal(profile.fitness_goal);
    setActivity(profile.activity_level);
    setTargets({
      calories: String(profile.daily_calorie_target ?? ''),
      protein: String(profile.protein_target ?? ''),
      carbs: String(profile.carbs_target ?? ''),
      fat: String(profile.fat_target ?? ''),
    });
  }, [profile]);

  if (!profile) return null;

  const parsed = () => {
    const h = Number(height.replace(',', '.'));
    const w = Number(weight.replace(',', '.'));
    if (!h || h < 100 || h > 250) return Alert.alert('Check your height', 'Enter a height between 100 and 250 cm.');
    if (!w || w < 30 || w > 300) return Alert.alert('Check your weight', 'Enter a weight between 30 and 300 kg.');
    if (!goal || !activity || !profile.age || !profile.gender) return Alert.alert('Missing details', 'Choose a goal and activity level.');
    return calculateAll({ gender: profile.gender, age: profile.age, height_cm: h, weight_kg: w, activity_level: activity, fitness_goal: goal });
  };

  const recalc = () => {
    const r = parsed();
    if (!r) return;
    setTargets({
      calories: String(r.targets.calories),
      protein: String(r.targets.protein),
      carbs: String(r.targets.carbs),
      fat: String(r.targets.fat),
    });
  };

  const save = async () => {
    const r = parsed();
    if (!r) return;
    const problem = validateTargets(targets);
    if (problem) return Alert.alert('Check your targets', problem);
    setBusy(true);
    try {
      await updateProfile({
        height_cm: Number(height.replace(',', '.')),
        weight_kg: Number(weight.replace(',', '.')),
        fitness_goal: goal,
        activity_level: activity,
        bmi: r.bmi,
        bmr: r.bmr,
        tdee: r.tdee,
        daily_calorie_target: Number(targets.calories),
        protein_target: Number(targets.protein),
        carbs_target: Number(targets.carbs),
        fat_target: Number(targets.fat),
      });
      Alert.alert('Saved', 'Your profile and targets are up to date.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen>
      <Text style={type.title}>Profile</Text>

      <Card>
        <Text style={type.heading}>{profile.full_name}</Text>
        <Text style={type.small}>{profile.age} years • {profile.gender}</Text>
        {profile.bmi ? (
          <>
            <Text style={type.body}>BMI {profile.bmi} ({bmiCategory(profile.bmi)})</Text>
            <Text style={type.small}>BMI is a general screening number, not a full picture of your health.</Text>
          </>
        ) : null}
        <Text style={type.small}>BMR {profile.bmr?.toLocaleString()} kcal • TDEE {profile.tdee?.toLocaleString()} kcal</Text>
      </Card>

      <Text style={type.heading}>Body and goal</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Height" suffix="cm" keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
        <Field label="Weight" suffix="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
      </View>
      <Chips label="Fitness goal" options={GOALS} value={goal} onChange={setGoal} />
      <Chips label="Activity level" options={ACTIVITY_LEVELS} value={activity} onChange={setActivity} stacked />

      <Text style={type.heading}>Daily targets</Text>
      <TargetsEditor value={targets} onChange={setTargets} />
      <Button title="Recalculate from my details" variant="secondary" onPress={recalc} />
      <Button title="Save changes" onPress={save} loading={busy} />
      <Button title="Sign out" variant="danger" onPress={confirmSignOut} />
    </Screen>
  );
}
