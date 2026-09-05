import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getToken, clearToken, getProfile, updateProfile, getWeights, Profile,
} from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { id: 'cut',        emoji: '🔥', label: 'Cut',          desc: 'Lose fat (−20% deficit)',            calFactor: 0.80, proteinFactor: 2.2 },
  { id: 'maintain',   emoji: '⚖️', label: 'Maintain',    desc: 'Hold current weight',                calFactor: 1.00, proteinFactor: 1.8 },
  { id: 'bulk',       emoji: '💪', label: 'Bulk',         desc: 'Build muscle (+10% surplus)',        calFactor: 1.10, proteinFactor: 2.0 },
  { id: 'keto',       emoji: '🥑', label: 'Keto',         desc: 'Very low carb, fat-fuelled',         calFactor: 0.85, proteinFactor: 1.6 },
  { id: 'highprotein',emoji: '🥩', label: 'High Protein', desc: 'Max muscle & satiety',               calFactor: 1.00, proteinFactor: 2.8 },
  { id: 'custom',     emoji: '✏️', label: 'Custom',       desc: 'Set your own targets',               calFactor: null, proteinFactor: null },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcBMI(weightKg: number, heightCm: number) {
  const hm = heightCm / 100;
  return weightKg / (hm * hm);
}

function bmiInfo(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#E8A854' };
  if (bmi < 25)   return { label: 'Normal weight', color: '#2F5233' };
  if (bmi < 30)   return { label: 'Overweight', color: '#E8A854' };
  return { label: 'Obese', color: '#B3401E' };
}

function calcTDEE(w: number, h: number, age: number, sex: string, activity: string) {
  const base = 10 * w + 6.25 * h - 5 * age;
  const bmr = sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : base - 78;
  return bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.55);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();

  const [bio, setBio] = useState({ height_cm: '', age: '', sex: '', activity_level: '' });
  const [currentWeight, setCurrentWeight] = useState('');
  const [dietType, setDietType] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{ calories: number; protein: number } | null>(null);
  const [form, setForm] = useState({
    daily_calorie_target: '', daily_protein_target_g: '', target_weight_kg: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    getToken().then(token => {
      if (!token) { router.replace('/(auth)/login'); return; }
      Promise.all([getProfile(), getWeights()])
        .then(([p, weights]) => {
          setBio({
            height_cm: p.height_cm?.toString() ?? '',
            age: p.age?.toString() ?? '',
            sex: p.sex ?? '',
            activity_level: p.activity_level ?? '',
          });
          setForm({
            daily_calorie_target: p.daily_calorie_target?.toString() ?? '',
            daily_protein_target_g: p.daily_protein_target_g?.toString() ?? '',
            target_weight_kg: p.target_weight_kg?.toString() ?? '',
          });
          if (weights.length > 0) setCurrentWeight(weights[0].weight_kg.toString());
        })
        .catch(() => setError("Couldn't load your profile."))
        .finally(() => setLoading(false));
    });
  }, []);

  // Recalculate recommendation
  useEffect(() => {
    if (!dietType || dietType === 'custom') { setRecommendation(null); return; }
    const w = parseFloat(currentWeight);
    const h = parseFloat(bio.height_cm);
    const a = parseInt(bio.age, 10);
    const s = bio.sex;
    const act = bio.activity_level;
    if (!w || !h || !a || !s || !act) { setRecommendation(null); return; }
    const diet = DIET_OPTIONS.find(d => d.id === dietType);
    if (!diet?.calFactor) { setRecommendation(null); return; }
    const tdee = calcTDEE(w, h, a, s, act);
    setRecommendation({
      calories: Math.round((tdee * diet.calFactor) / 50) * 50,
      protein: Math.round(w * diet.proteinFactor!),
    });
  }, [currentWeight, bio, dietType]);

  function applyRecommendation() {
    if (!recommendation) return;
    setForm(f => ({
      ...f,
      daily_calorie_target: recommendation.calories.toString(),
      daily_protein_target_g: recommendation.protein.toString(),
    }));
  }

  async function handleSave() {
    setError(null); setSaved(false); setSaving(true);
    try {
      await updateProfile({
        height_cm: bio.height_cm ? Number(bio.height_cm) : null,
        age: bio.age ? Number(bio.age) : null,
        sex: (bio.sex || null) as Profile['sex'],
        activity_level: (bio.activity_level || null) as Profile['activity_level'],
        daily_calorie_target: form.daily_calorie_target ? Number(form.daily_calorie_target) : null,
        daily_protein_target_g: form.daily_protein_target_g ? Number(form.daily_protein_target_g) : null,
        target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save your settings. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await clearToken();
    router.replace('/(auth)/login');
  }

  const w = parseFloat(currentWeight);
  const h = parseFloat(bio.height_cm);
  const bmi = w && h ? calcBMI(w, h) : null;
  const bmiDisplay = bmi ? bmiInfo(bmi) : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F5233" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile & Goals</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Log out</Text>
        </Pressable>
      </View>

      {/* ── Your body ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR BODY</Text>
        <View style={styles.bioGrid}>
          <View style={styles.bioField}>
            <Text style={styles.fieldLabel}>Height</Text>
            <View style={styles.unitInput}>
              <TextInput
                style={styles.input} value={bio.height_cm}
                onChangeText={v => setBio({ ...bio, height_cm: v })}
                keyboardType="decimal-pad" placeholder="e.g. 175" placeholderTextColor="#9A9484"
              />
              <Text style={styles.unitText}>cm</Text>
            </View>
          </View>
          <View style={styles.bioField}>
            <Text style={styles.fieldLabel}>Current weight</Text>
            <View style={styles.unitInput}>
              <TextInput
                style={styles.input} value={currentWeight}
                onChangeText={setCurrentWeight}
                keyboardType="decimal-pad" placeholder="e.g. 80" placeholderTextColor="#9A9484"
              />
              <Text style={styles.unitText}>kg</Text>
            </View>
          </View>
          <View style={styles.bioField}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input} value={bio.age}
              onChangeText={v => setBio({ ...bio, age: v })}
              keyboardType="number-pad" placeholder="e.g. 28" placeholderTextColor="#9A9484"
            />
          </View>
          <View style={styles.bioField}>
            <Text style={styles.fieldLabel}>Sex</Text>
            <View style={styles.sexRow}>
              {(['male', 'female', 'other'] as const).map(s => (
                <Pressable
                  key={s}
                  style={[styles.sexBtn, bio.sex === s && styles.sexBtnActive]}
                  onPress={() => setBio({ ...bio, sex: s })}
                >
                  <Text style={[styles.sexBtnText, bio.sex === s && styles.sexBtnTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {bmi && bmiDisplay && (
          <View style={styles.bmiBadge}>
            <Text style={styles.bmiLabel}>Your BMI</Text>
            <View style={styles.bmiRight}>
              <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
              <View style={[styles.bmiPill, { backgroundColor: bmiDisplay.color }]}>
                <Text style={styles.bmiPillText}>{bmiDisplay.label}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Activity level ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVITY LEVEL</Text>
        {ACTIVITY_OPTIONS.map(opt => (
          <Pressable
            key={opt.id}
            style={[styles.optionBtn, bio.activity_level === opt.id && styles.optionBtnActive]}
            onPress={() => setBio({ ...bio, activity_level: opt.id })}
          >
            <Text style={[styles.optionLabel, bio.activity_level === opt.id && styles.optionLabelActive]}>
              {opt.label}
            </Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Diet goal ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CHOOSE YOUR GOAL</Text>
        <View style={styles.dietGrid}>
          {DIET_OPTIONS.map(d => (
            <Pressable
              key={d.id}
              style={[styles.dietCard, dietType === d.id && styles.dietCardActive]}
              onPress={() => setDietType(d.id)}
            >
              <Text style={styles.dietEmoji}>{d.emoji}</Text>
              <Text style={[styles.dietLabel, dietType === d.id && styles.dietLabelActive]}>
                {d.label}
              </Text>
              <Text style={styles.dietDesc}>{d.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Recommendation ── */}
      {recommendation && dietType !== 'custom' && (
        <View style={styles.recommendSection}>
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
          <Pressable style={styles.applyBtn} onPress={applyRecommendation}>
            <Text style={styles.applyBtnText}>Apply these targets</Text>
          </Pressable>
        </View>
      )}

      {/* ── Daily targets ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DAILY TARGETS</Text>
        {[
          { key: 'daily_calorie_target', label: 'Calorie target', unit: 'kcal', placeholder: 'e.g. 2000' },
          { key: 'daily_protein_target_g', label: 'Protein target', unit: 'g', placeholder: 'e.g. 150' },
          { key: 'target_weight_kg', label: 'Goal weight', unit: 'kg', placeholder: 'e.g. 75' },
        ].map(({ key, label, unit, placeholder }) => (
          <View key={key} style={styles.targetField}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.unitInput}>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={v => setForm({ ...form, [key]: v })}
                keyboardType="decimal-pad"
                placeholder={placeholder}
                placeholderTextColor="#9A9484"
              />
              <Text style={styles.unitText}>{unit}</Text>
            </View>
          </View>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {saved && <Text style={styles.savedText}>✓ Settings saved.</Text>}

      <Pressable
        style={[styles.saveBtn, saving && styles.btnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save settings'}</Text>
        }
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F6F3EC' },
  scroll: { paddingHorizontal: 16, paddingTop: 56, gap: 12 },
  center: { flex: 1, backgroundColor: '#F6F3EC', alignItems: 'center', justifyContent: 'center' },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1C2B1E' },
  logoutBtn: { fontSize: 13, color: '#5B6B5D', textDecorationLine: 'underline' },
  section: {
    backgroundColor: '#fff', borderRadius: 20, borderWidth: 1,
    borderColor: '#E7E2D6', padding: 18, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#5B6B5D', letterSpacing: 1 },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bioField: { width: '47%' },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: '#1C2B1E', marginBottom: 6 },
  targetField: { gap: 6 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1C2B1E', backgroundColor: '#fff',
  },
  unitInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10, backgroundColor: '#fff', paddingRight: 10 },
  unitText: { fontSize: 12, color: '#9A9484' },
  sexRow: { flexDirection: 'row', gap: 4 },
  sexBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD7C7', alignItems: 'center', backgroundColor: '#fff' },
  sexBtnActive: { backgroundColor: '#2F5233', borderColor: '#2F5233' },
  sexBtnText: { fontSize: 11, fontWeight: '500', color: '#5B6B5D', textTransform: 'capitalize' },
  sexBtnTextActive: { color: '#fff' },
  bmiBadge: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F6F3EC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  bmiLabel: { fontSize: 13, color: '#5B6B5D' },
  bmiRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bmiValue: { fontSize: 20, fontWeight: '700', color: '#1C2B1E' },
  bmiPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  bmiPillText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  optionBtn: {
    borderWidth: 1, borderColor: '#E7E2D6', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
  },
  optionBtnActive: { backgroundColor: '#EEF4EE', borderColor: '#2F5233' },
  optionLabel: { fontSize: 13, fontWeight: '600', color: '#1C2B1E' },
  optionLabelActive: { color: '#2F5233' },
  optionDesc: { fontSize: 11, color: '#9A9484', marginTop: 2 },
  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dietCard: {
    width: '47%', borderWidth: 1, borderColor: '#E7E2D6', borderRadius: 14,
    padding: 12, backgroundColor: '#fff',
  },
  dietCardActive: { backgroundColor: '#EEF4EE', borderColor: '#2F5233' },
  dietEmoji: { fontSize: 24, marginBottom: 4 },
  dietLabel: { fontSize: 13, fontWeight: '700', color: '#1C2B1E' },
  dietLabelActive: { color: '#2F5233' },
  dietDesc: { fontSize: 10, color: '#9A9484', marginTop: 3, lineHeight: 14 },
  recommendSection: {
    backgroundColor: '#EEF4EE', borderRadius: 20, borderWidth: 1,
    borderColor: '#2F5233', padding: 18, gap: 12,
  },
  recommendTitle: { fontSize: 10, fontWeight: '700', color: '#2F5233', letterSpacing: 1 },
  recommendRow: { flexDirection: 'row', alignItems: 'center' },
  recommendItem: { flex: 1, alignItems: 'center' },
  recommendValue: { fontSize: 28, fontWeight: '700', color: '#1C2B1E' },
  recommendUnit: { fontSize: 11, color: '#5B6B5D', marginTop: 2 },
  recommendDivider: { width: 1, height: 48, backgroundColor: '#C8DBC9' },
  applyBtn: {
    backgroundColor: '#2F5233', borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#B3401E', fontSize: 13 },
  savedText: { color: '#2F5233', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2F5233', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#2F5233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
