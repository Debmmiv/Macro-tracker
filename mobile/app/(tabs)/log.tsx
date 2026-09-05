import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getToken, searchFoods, searchExternalFoods, logFood, createFood,
  Food, ExternalFood,
} from '@/lib/api';

// Converts servings into an amount label e.g. 1.5 × "100g" → "150g"
function computeAmountLabel(servingSize: string, servings: number): string {
  const match = servingSize.match(/^([\d.]+)\s*(.*)$/);
  if (!match) return `${servings}x ${servingSize}`;
  const baseAmount = parseFloat(match[1]);
  const unit = match[2].trim();
  if (isNaN(baseAmount)) return `${servings}x ${servingSize}`;
  const total = baseAmount * servings;
  const totalFormatted = Number.isInteger(total) ? total.toString() : total.toFixed(1);
  if (!unit) return totalFormatted;
  const noSpaceUnit = /^[a-zA-Z]{1,2}$/.test(unit);
  return noSpaceUnit ? `${totalFormatted}${unit}` : `${totalFormatted} ${unit}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FoodRow({ food, onLog }: { food: Food; onLog: (food: Food, servings: number) => void }) {
  const [servings, setServings] = useState('1');
  return (
    <View style={styles.foodCard}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
        <Text style={styles.foodMeta}>
          {food.serving_size} · {food.calories} cal · {food.protein}g protein
        </Text>
        <Text style={styles.amountLabel}>
          = {computeAmountLabel(food.serving_size, parseFloat(servings) || 0)}
        </Text>
      </View>
      <View style={styles.foodActions}>
        <TextInput
          style={styles.servingsInput}
          value={servings}
          onChangeText={setServings}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <Pressable style={styles.addBtn} onPress={() => onLog(food, parseFloat(servings) || 1)}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ExternalFoodRow({
  food, onImportAndLog,
}: {
  food: ExternalFood;
  onImportAndLog: (food: ExternalFood, servings: number) => void;
}) {
  const [servings, setServings] = useState('1');
  return (
    <View style={[styles.foodCard, styles.foodCardExternal]}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
        <Text style={styles.foodMeta}>
          {food.serving_size} · {food.calories} cal · {food.protein}g protein
        </Text>
        <Text style={styles.amountLabel}>
          = {computeAmountLabel(food.serving_size, parseFloat(servings) || 0)}
        </Text>
      </View>
      <View style={styles.foodActions}>
        <TextInput
          style={styles.servingsInput}
          value={servings}
          onChangeText={setServings}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <Pressable
          style={[styles.addBtn, styles.importBtn]}
          onPress={() => onImportAndLog(food, parseFloat(servings) || 1)}
        >
          <Text style={[styles.addBtnText, styles.importBtnText]}>Import</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface NewFoodFormProps {
  onCreated: (food: Food) => void;
  onCancel: () => void;
}

function NewFoodForm({ onCreated, onCancel }: NewFoodFormProps) {
  const [form, setForm] = useState({
    name: '', serving_size: '', calories: '', protein: '', carbs: '', fat: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.name || !form.serving_size || !form.calories) return;
    setError(null);
    setSaving(true);
    try {
      const food = await createFood({
        name: form.name,
        serving_size: form.serving_size,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
      });
      onCreated(food);
    } catch {
      setError("Couldn't save that food. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.newFoodCard}>
      <Text style={styles.newFoodTitle}>Add new food</Text>
      {(['name', 'serving_size'] as const).map((field) => (
        <TextInput
          key={field}
          style={styles.input}
          value={form[field]}
          onChangeText={(v) => setForm({ ...form, [field]: v })}
          placeholder={field === 'name' ? 'Food name' : 'Serving size (e.g. 100g, 1 cup)'}
          placeholderTextColor="#9A9484"
        />
      ))}
      <View style={styles.macroInputRow}>
        {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
          <TextInput
            key={field}
            style={[styles.input, styles.macroInput]}
            value={form[field]}
            onChangeText={(v) => setForm({ ...form, [field]: v })}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1) + (field === 'calories' ? '' : ' (g)')}
            placeholderTextColor="#9A9484"
            keyboardType="decimal-pad"
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.newFoodButtons}>
        <Pressable style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save food</Text>}
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LogFoodScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [externalResults, setExternalResults] = useState<ExternalFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showNewFoodForm, setShowNewFoodForm] = useState(false);
  const [externalSearchError, setExternalSearchError] = useState<string | null>(null);

  useEffect(() => {
    getToken().then((token) => {
      if (!token) router.replace('/(auth)/login');
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query.trim()) {
        setResults([]); setExternalResults([]); setExternalSearchError(null); return;
      }
      setSearching(true);
      setExternalSearchError(null);

      Promise.all([
        searchFoods(query).catch(() => [] as Food[]),
        searchExternalFoods(query).catch(() => {
          setExternalSearchError("Couldn't search the USDA database — you can still add food manually.");
          return [] as ExternalFood[];
        }),
      ]).then(([localResults, apiResults]) => {
        setResults(localResults);
        const localNames = new Set(localResults.map((f) => f.name.toLowerCase()));
        setExternalResults(apiResults.filter((f) => !localNames.has(f.name.toLowerCase())));
      }).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleLog(food: Food, servings: number) {
    setMessage(null);
    try {
      await logFood(food.id, servings);
      setMessage(`Logged ${servings}x ${food.name}.`);
      setQuery(''); setResults([]); setExternalResults([]);
    } catch {
      setMessage("Couldn't log that food. Try again.");
    }
  }

  async function handleImportAndLog(food: ExternalFood, servings: number) {
    setMessage(null);
    try {
      const created = await createFood({
        name: food.name, serving_size: food.serving_size,
        calories: food.calories, protein: food.protein,
        carbs: food.carbs, fat: food.fat,
      });
      await logFood(created.id, servings);
      setMessage(`Added ${food.name} and logged ${servings}x.`);
      setQuery(''); setResults([]); setExternalResults([]);
    } catch {
      setMessage("Couldn't import that food. Try again.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.bg}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Log food</Text>

        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a food..."
          placeholderTextColor="#9A9484"
          returnKeyType="search"
          autoCorrect={false}
        />

        {message && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        )}

        {searching && <ActivityIndicator color="#2F5233" style={{ marginVertical: 8 }} />}

        {externalSearchError && (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>{externalSearchError}</Text>
          </View>
        )}

        {!searching && query.trim() && results.length === 0 && externalResults.length === 0 && !externalSearchError && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No results for "{query}".</Text>
            <Pressable onPress={() => setShowNewFoodForm(true)}>
              <Text style={styles.addManualLink}>Add it as a new food</Text>
            </Pressable>
          </View>
        )}

        {results.map((food) => (
          <FoodRow key={food.id} food={food} onLog={handleLog} />
        ))}

        {!searching && externalResults.length > 0 && (
          <Text style={styles.externalLabel}>Not in your foods yet — from the USDA database:</Text>
        )}

        {externalResults.map((food) => (
          <ExternalFoodRow key={food.fdc_id} food={food} onImportAndLog={handleImportAndLog} />
        ))}

        {!showNewFoodForm && (
          <Pressable onPress={() => setShowNewFoodForm(true)} style={styles.addManualBtn}>
            <Text style={styles.addManualBtnText}>+ Add a new food manually</Text>
          </Pressable>
        )}

        {showNewFoodForm && (
          <NewFoodForm
            onCreated={(food) => {
              setShowNewFoodForm(false);
              setMessage(`Added ${food.name} to your foods.`);
            }}
            onCancel={() => setShowNewFoodForm(false)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F6F3EC' },
  bg: { flex: 1, backgroundColor: '#F6F3EC' },
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 32, gap: 10 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1C2B1E', marginBottom: 4 },
  searchInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD7C7',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1C2B1E',
  },
  successBanner: { backgroundColor: '#EEF4EE', borderRadius: 10, padding: 12 },
  successText: { color: '#49a43b', fontSize: 13, fontWeight: '500' },
  warnBanner: { backgroundColor: '#FBEFE9', borderRadius: 10, borderWidth: 1, borderColor: '#E8C4B4', padding: 12 },
  warnText: { color: '#B3401E', fontSize: 13 },
  noResults: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E7E2D6', padding: 16, gap: 8 },
  noResultsText: { color: '#5B6B5D', fontSize: 13 },
  addManualLink: { color: '#49a43b', fontWeight: '600', fontSize: 13 },
  externalLabel: { fontSize: 11, color: '#5B6B5D', fontStyle: 'italic' },
  foodCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E7E2D6',
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  foodCardExternal: { backgroundColor: '#F6F3EC', borderStyle: 'dashed', borderColor: '#DDD7C7' },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#1C2B1E' },
  foodMeta: { fontSize: 11, color: '#5B6B5D', marginTop: 2 },
  amountLabel: { fontSize: 11, color: '#9A9484', marginTop: 3 },
  foodActions: { alignItems: 'center', gap: 6 },
  servingsInput: {
    width: 52, borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 6, fontSize: 14, color: '#1C2B1E',
    textAlign: 'center', backgroundColor: '#fff',
  },
  addBtn: { backgroundColor: '#49a43b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  importBtn: { backgroundColor: '#E8A854' },
  importBtnText: { color: '#1C2B1E' },
  addManualBtn: { paddingVertical: 8 },
  addManualBtnText: { color: '#5B6B5D', fontSize: 13, textDecorationLine: 'underline' },
  newFoodCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E7E2D6', padding: 16, gap: 10,
  },
  newFoodTitle: { fontSize: 15, fontWeight: '700', color: '#1C2B1E' },
  input: {
    borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1C2B1E', backgroundColor: '#fff',
  },
  macroInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroInput: { flex: 1, minWidth: '45%' },
  errorText: { color: '#B3401E', fontSize: 13 },
  newFoodButtons: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, backgroundColor: '#49a43b', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelBtn: { borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#5B6B5D', fontSize: 14 },
});
