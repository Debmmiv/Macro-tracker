import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  Modal, ActivityIndicator, Dimensions,
} from 'react-native';
import { updateProfile, logWeight, Profile } from '@/lib/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#49a43b';

const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary',         desc: 'Desk job, little/no exercise' },
  { id: 'light',     label: 'Lightly active',    desc: '1–3 days/week exercise' },
  { id: 'moderate',  label: 'Moderately active', desc: '3–5 days/week exercise' },
  { id: 'active',    label: 'Very active',        desc: '6–7 days/week exercise' },
  { id: 'athlete',   label: 'Athlete',            desc: 'Training twice daily' },
] as const;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.20, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.90,
};

const DIET_OPTIONS = [
  { id: 'cut',         emoji: '🔥', label: 'Cut',          desc: 'Lose fat — 20% deficit',         calFactor: 0.80, proteinFactor: 2.2 },
  { id: 'maintain',   emoji: '⚖️', label: 'Maintain',     desc: 'Hold your weight & composition', calFactor: 1.00, proteinFactor: 1.8 },
  { id: 'bulk',        emoji: '💪', label: 'Bulk',         desc: 'Build muscle — 10% surplus',     calFactor: 1.10, proteinFactor: 2.0 },
  { id: 'keto',        emoji: '🥑', label: 'Keto',         desc: 'Very low carb, fat-fuelled',     calFactor: 0.85, proteinFactor: 1.6 },
  { id: 'highprotein', emoji: '🥩', label: 'High Protein', desc: 'Max muscle & satiety',           calFactor: 1.00, proteinFactor: 2.8 },
  { id: 'custom',      emoji: '✏️', label: 'Custom',       desc: 'Set your own targets',           calFactor: null, proteinFactor: null },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcBMI(w: number, h: number) { const hm = h / 100; return w / (hm * hm); }
function bmiInfo(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#E8A854' };
  if (bmi < 25)   return { label: 'Normal weight', color: PRIMARY };
  if (bmi < 30)   return { label: 'Overweight', color: '#E8A854' };
  return { label: 'Obese', color: '#B3401E' };
}
function calcTDEE(w: number, h: number, age: number, sex: string, act: string) {
  const base = 10 * w + 6.25 * h - 5 * age;
  const bmr = sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : base - 78;
  return bmr * (ACTIVITY_MULTIPLIERS[act] ?? 1.55);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

export default function OnboardingModal({ visible, onComplete }: Props) {
  const [step, setStep] = useState(1);

  // Step 1
  const [height, setHeight]   = useState('');
  const [weight, setWeight]   = useState('');
  const [age, setAge]         = useState('');
  const [sex, setSex]         = useState('');

  // Step 2
  const [activity, setActivity] = useState('');

  // Step 3
  const [dietType, setDietType]             = useState<string | null>(null);
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein]   = useState('');

  const w   = parseFloat(weight);
  const h   = parseFloat(height);
  const bmi = w && h ? calcBMI(w, h) : null;
  const bmiDisplay = bmi ? bmiInfo(bmi) : null;

  const [recommendation, setRecommendation] = useState<{ calories: number; protein: number } | null>(null);

  useEffect(() => {
    if (!dietType || dietType === 'custom') { setRecommendation(null); return; }
    const a = parseInt(age, 10);
    if (!w || !h || !a || !sex || !activity) { setRecommendation(null); return; }
    const diet = DIET_OPTIONS.find(d => d.id === dietType);
    if (!diet?.calFactor) { setRecommendation(null); return; }
    const tdee = calcTDEE(w, h, a, sex, activity);
    setRecommendation({
      calories: Math.round((tdee * diet.calFactor!) / 50) * 50,
      protein:  Math.round(w * diet.proteinFactor!),
    });
  }, [weight, height, age, sex, activity, dietType]);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const step1Valid = height.trim() !== '' && weight.trim() !== '' && age.trim() !== '' && sex !== '';
  const step2Valid = activity !== '';
  const appliedCalories = dietType === 'custom' ? (customCalories ? Number(customCalories) : null) : recommendation?.calories ?? null;
  const appliedProtein  = dietType === 'custom' ? (customProtein  ? Number(customProtein)  : null) : recommendation?.protein  ?? null;
  const step3Valid = dietType !== null && (dietType !== 'custom' ? recommendation !== null : (customCalories.trim() !== '' && customProtein.trim() !== ''));

  async function handleFinish() {
    setSaving(true); setError(null);
    try {
      await updateProfile({
        height_cm: h || null,
        age: parseInt(age, 10) || null,
        sex: (sex || null) as Profile['sex'],
        activity_level: (activity || null) as Profile['activity_level'],
        daily_calorie_target: appliedCalories,
        daily_protein_target_g: appliedProtein,
      });
      if (w) await logWeight(w);
      onComplete();
    } catch {
      setError("Couldn't save your settings. You can update them later in Profile.");
      setSaving(false);
    }
  }

  const stepTitles = ['Tell us about yourself', 'How active are you?', 'Choose your goal'];
  const stepSubs   = [
    'We\'ll use this to calculate your personalised targets.',
    'Affects how many calories you burn each day.',
    'We\'ll recommend daily calorie & protein targets.',
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>

          {/* ── Header ── */}
          <View style={styles.header}>
            {/* Progress pills */}
            <View style={styles.progressRow}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View key={i} style={[styles.progressPill, i < step && styles.progressPillActive]} />
              ))}
            </View>
            <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
            <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>
            <Text style={styles.stepSub}>{stepSubs[step - 1]}</Text>
          </View>

          {/* ── Body ── */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">

            {/* ═══ STEP 1 — Body ═══ */}
            {step === 1 && (
              <View style={styles.grid2}>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>Height</Text>
                  <View style={styles.unitRow}>
                    <TextInput style={styles.input} value={height} onChangeText={setHeight}
                      keyboardType="decimal-pad" placeholder="175" placeholderTextColor="#9A9484" />
                    <Text style={styles.unit}>cm</Text>
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>Current weight</Text>
                  <View style={styles.unitRow}>
                    <TextInput style={styles.input} value={weight} onChangeText={setWeight}
                      keyboardType="decimal-pad" placeholder="80" placeholderTextColor="#9A9484" />
                    <Text style={styles.unit}>kg</Text>
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput style={styles.inputFull} value={age} onChangeText={setAge}
                    keyboardType="number-pad" placeholder="28" placeholderTextColor="#9A9484" />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>Sex</Text>
                  <View style={styles.sexRow}>
                    {(['male', 'female', 'other'] as const).map(s => (
                      <Pressable key={s}
                        style={[styles.sexBtn, sex === s && styles.sexBtnActive]}
                        onPress={() => setSex(s)}>
                        <Text style={[styles.sexBtnText, sex === s && styles.sexBtnTextActive]}>
                          {s === 'other' ? 'Other' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {bmi && bmiDisplay && (
                  <View style={[styles.bmiBadge, { borderColor: bmiDisplay.color + '60', backgroundColor: bmiDisplay.color + '15' }]}>
                    <Text style={styles.bmiLabelText}>Your BMI</Text>
                    <View style={styles.bmiRight}>
                      <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
                      <View style={[styles.bmiPill, { backgroundColor: bmiDisplay.color }]}>
                        <Text style={styles.bmiPillText}>{bmiDisplay.label}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ═══ STEP 2 — Activity ═══ */}
            {step === 2 && (
              <View style={{ gap: 8 }}>
                {ACTIVITY_OPTIONS.map(opt => (
                  <Pressable key={opt.id}
                    style={[styles.optionBtn, activity === opt.id && styles.optionBtnActive]}
                    onPress={() => setActivity(opt.id)}>
                    <Text style={[styles.optionLabel, activity === opt.id && styles.optionLabelActive]}>{opt.label}</Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ═══ STEP 3 — Diet Goal ═══ */}
            {step === 3 && (
              <View style={{ gap: 12 }}>
                <View style={styles.dietGrid}>
                  {DIET_OPTIONS.map(d => (
                    <Pressable key={d.id}
                      style={[styles.dietCard, dietType === d.id && styles.dietCardActive]}
                      onPress={() => setDietType(d.id)}>
                      <Text style={styles.dietEmoji}>{d.emoji}</Text>
                      <Text style={[styles.dietLabel, dietType === d.id && styles.dietLabelActive]}>{d.label}</Text>
                      <Text style={styles.dietDesc}>{d.desc}</Text>
                    </Pressable>
                  ))}
                </View>

                {recommendation && dietType !== 'custom' && (
                  <View style={styles.recommendCard}>
                    <Text style={styles.recommendTitle}>RECOMMENDED FOR YOU</Text>
                    <View style={styles.recommendRow}>
                      <View style={styles.recommendItem}>
                        <Text style={styles.recommendValue}>{recommendation.calories}</Text>
                        <Text style={styles.recommendUnit}>kcal / day</Text>
                      </View>
                      <View style={styles.recommendDivider} />
                      <View style={styles.recommendItem}>
                        <Text style={styles.recommendValue}>{recommendation.protein}g</Text>
                        <Text style={styles.recommendUnit}>protein / day</Text>
                      </View>
                    </View>
                  </View>
                )}

                {dietType === 'custom' && (
                  <View style={styles.customCard}>
                    <Text style={styles.customTitle}>Your custom targets</Text>
                    <View style={{ gap: 8 }}>
                      <View>
                        <Text style={styles.fieldLabel}>Calories (kcal)</Text>
                        <TextInput style={styles.inputFull} value={customCalories} onChangeText={setCustomCalories}
                          keyboardType="decimal-pad" placeholder="e.g. 2000" placeholderTextColor="#9A9484" />
                      </View>
                      <View>
                        <Text style={styles.fieldLabel}>Protein (g)</Text>
                        <TextInput style={styles.inputFull} value={customProtein} onChangeText={setCustomProtein}
                          keyboardType="decimal-pad" placeholder="e.g. 150" placeholderTextColor="#9A9484" />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            {step < TOTAL_STEPS ? (
              <>
                <Pressable
                  style={[styles.primaryBtn, ((step === 1 && !step1Valid) || (step === 2 && !step2Valid)) && styles.btnDisabled]}
                  onPress={() => setStep(step + 1)}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                >
                  <Text style={styles.primaryBtnText}>Continue →</Text>
                </Pressable>
                {step > 1 && (
                  <Pressable onPress={() => setStep(step - 1)}>
                    <Text style={styles.backLink}>← Back</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.primaryBtn, (!step3Valid || saving) && styles.btnDisabled]}
                  onPress={handleFinish}
                  disabled={!step3Valid || saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>Let's go! 🎉</Text>
                  }
                </Pressable>
                <Pressable onPress={() => setStep(step - 1)}>
                  <Text style={styles.backLink}>← Back</Text>
                </Pressable>
                <Pressable onPress={onComplete}>
                  <Text style={styles.skipLink}>Skip for now</Text>
                </Pressable>
              </>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.92, overflow: 'hidden',
  },
  header: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  progressPill: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressPillActive: { backgroundColor: '#E8A854' },
  stepLabel: { fontSize: 11, fontWeight: '700', color: '#E8A854', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  stepSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  body: { flexShrink: 1 },
  bodyContent: { padding: 20, gap: 12 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1C2B1E', marginBottom: 6 },
  unitRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10, backgroundColor: '#fff', paddingRight: 10 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1C2B1E' },
  inputFull: { borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1C2B1E', backgroundColor: '#fff' },
  unit: { fontSize: 12, color: '#9A9484' },
  sexRow: { flexDirection: 'row', gap: 4 },
  sexBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD7C7', alignItems: 'center', backgroundColor: '#fff' },
  sexBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  sexBtnText: { fontSize: 10, fontWeight: '600', color: '#5B6B5D' },
  sexBtnTextActive: { color: '#fff' },
  bmiBadge: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  bmiLabelText: { fontSize: 13, color: '#5B6B5D' },
  bmiRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bmiValue: { fontSize: 20, fontWeight: '700', color: '#1C2B1E' },
  bmiPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  bmiPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  optionBtn: { borderWidth: 1, borderColor: '#E7E2D6', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FAFAF8' },
  optionBtnActive: { backgroundColor: '#F0FAF0', borderColor: PRIMARY },
  optionLabel: { fontSize: 14, fontWeight: '700', color: '#1C2B1E' },
  optionLabelActive: { color: PRIMARY },
  optionDesc: { fontSize: 12, color: '#9A9484', marginTop: 2 },
  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dietCard: { width: '47%', borderWidth: 1, borderColor: '#E7E2D6', borderRadius: 14, padding: 12, backgroundColor: '#FAFAF8' },
  dietCardActive: { backgroundColor: '#F0FAF0', borderColor: PRIMARY },
  dietEmoji: { fontSize: 22, marginBottom: 4 },
  dietLabel: { fontSize: 13, fontWeight: '700', color: '#1C2B1E' },
  dietLabelActive: { color: PRIMARY },
  dietDesc: { fontSize: 10, color: '#9A9484', marginTop: 2, lineHeight: 14 },
  recommendCard: { backgroundColor: '#F0FAF0', borderRadius: 16, borderWidth: 1, borderColor: PRIMARY, padding: 16, gap: 10 },
  recommendTitle: { fontSize: 10, fontWeight: '700', color: PRIMARY, letterSpacing: 1.2, textTransform: 'uppercase' },
  recommendRow: { flexDirection: 'row', alignItems: 'center' },
  recommendItem: { flex: 1, alignItems: 'center' },
  recommendValue: { fontSize: 26, fontWeight: '800', color: '#1C2B1E' },
  recommendUnit: { fontSize: 11, color: '#5B6B5D', marginTop: 2 },
  recommendDivider: { width: 1, height: 44, backgroundColor: '#C8DBC9' },
  customCard: { backgroundColor: '#FAFAF8', borderRadius: 14, borderWidth: 1, borderColor: '#E7E2D6', padding: 14, gap: 8 },
  customTitle: { fontSize: 13, fontWeight: '700', color: '#1C2B1E' },
  errorText: { color: '#B3401E', fontSize: 13, textAlign: 'center' },
  footer: { padding: 20, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#F0EBE1' },
  primaryBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  backLink: { textAlign: 'center', fontSize: 13, color: '#5B6B5D', paddingVertical: 4 },
  skipLink: { textAlign: 'center', fontSize: 12, color: '#9A9484' },
});
