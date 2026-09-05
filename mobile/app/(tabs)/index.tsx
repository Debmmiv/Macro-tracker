import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getToken, getDailySummary, getWeights, getTodayLogs,
  deleteLog, logWeight,
  DailySummary, WeightEntry, TodayLogEntry,
} from '@/lib/api';
import ProgressRing from '@/components/ProgressRing';

export default function DashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [todayLogs, setTodayLogs] = useState<TodayLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Weight form
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [weightMsg, setWeightMsg] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const token = await getToken();
    if (!token) { router.replace('/(auth)/login'); return; }
    try {
      const [summaryData, weights, logs] = await Promise.all([
        getDailySummary(), getWeights(), getTodayLogs(),
      ]);
      setSummary(summaryData);
      setLatestWeight(weights[0] ?? null);
      setTodayLogs(logs);
      setError(null);
    } catch {
      setError("Couldn't load your data.");
    }
  }, [router]);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  async function handleDeleteLog(logId: number) {
    try {
      await deleteLog(logId);
      await loadDashboard();
    } catch {
      Alert.alert('Error', "Couldn't remove that entry. Try again.");
    }
  }

  async function handleLogWeight() {
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    setLoggingWeight(true);
    try {
      await logWeight(kg);
      await loadDashboard();
      setWeightInput('');
      setShowWeightForm(false);
      setWeightMsg(`Logged ${kg}kg.`);
      setTimeout(() => setWeightMsg(null), 3000);
    } catch {
      setWeightMsg("Couldn't log weight. Try again.");
    } finally {
      setLoggingWeight(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F5233" />
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
        <Pressable style={styles.retryBtn} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2F5233" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Today</Text>
        <Text style={styles.headerDate}>{summary.date}</Text>
      </View>

      {/* Progress rings */}
      <View style={styles.card}>
        <View style={styles.ringsRow}>
          <ProgressRing
            label="Calories" value={summary.totals.calories}
            target={summary.targets.daily_calorie_target} unit="" color="#E8A854"
          />
          <ProgressRing
            label="Protein" value={summary.totals.protein}
            target={summary.targets.daily_protein_target_g} unit="g" color="#2F5233"
          />
        </View>
      </View>

      {/* Carbs & Fat */}
      <View style={[styles.card, styles.macroGrid]}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{Math.round(summary.totals.carbs)}g</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>{Math.round(summary.totals.fat)}g</Text>
        </View>
      </View>

      {/* Today's food log */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Today's food</Text>
        {todayLogs.length === 0 ? (
          <Text style={styles.emptyText}>Nothing logged yet today.</Text>
        ) : (
          todayLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.logInfo}>
                <Text style={styles.logName} numberOfLines={1}>
                  {log.servings}× {log.food_detail.name}
                </Text>
                <Text style={styles.logCal}>
                  {Math.round(log.food_detail.calories * log.servings)} cal
                </Text>
              </View>
              <Pressable onPress={() => handleDeleteLog(log.id)}>
                <Text style={styles.removeBtn}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Weight */}
      <View style={styles.card}>
        <View style={styles.weightHeader}>
          <Text style={styles.sectionLabel}>Latest weight</Text>
          <Pressable onPress={() => { setShowWeightForm(v => !v); setWeightMsg(null); }}>
            <Text style={styles.weightToggle}>
              {showWeightForm ? 'Cancel' : '+ Log weight'}
            </Text>
          </Pressable>
        </View>

        {latestWeight ? (
          <Text style={styles.weightValue}>
            {latestWeight.weight_kg}kg{' '}
            <Text style={styles.weightDate}>on {latestWeight.date}</Text>
          </Text>
        ) : (
          <Text style={styles.emptyText}>No weight logged yet.</Text>
        )}

        {showWeightForm && (
          <View style={styles.weightForm}>
            <View style={styles.weightInputWrapper}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 75.5"
                placeholderTextColor="#9A9484"
                autoFocus
              />
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            <Pressable
              style={[styles.saveBtn, loggingWeight && styles.btnDisabled]}
              onPress={handleLogWeight}
              disabled={loggingWeight}
            >
              {loggingWeight
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </Pressable>
          </View>
        )}

        {weightMsg && <Text style={styles.weightMsg}>{weightMsg}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F6F3EC' },
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24, gap: 12 },
  center: { flex: 1, backgroundColor: '#F6F3EC', alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#B3401E', fontSize: 14 },
  retryBtn: { backgroundColor: '#49a43b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#5B6B5D' },
  headerDate: { fontSize: 20, fontWeight: '700', color: '#1C2B1E' },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1, borderColor: '#E7E2D6',
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroGrid: { flexDirection: 'row', alignItems: 'center' },
  macroItem: { flex: 1, alignItems: 'center' },
  macroDivider: { width: 1, height: 36, backgroundColor: '#E7E2D6' },
  macroLabel: { fontSize: 12, color: '#5B6B5D', marginBottom: 4 },
  macroValue: { fontSize: 20, fontWeight: '700', color: '#1C2B1E' },
  sectionLabel: { fontSize: 11, color: '#5B6B5D', marginBottom: 12, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  emptyText: { fontSize: 13, color: '#5B6B5D' },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: '500', color: '#1C2B1E' },
  logCal: { fontSize: 12, color: '#5B6B5D', marginTop: 2 },
  removeBtn: { fontSize: 12, color: '#B3401E', fontWeight: '500' },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  weightToggle: { fontSize: 13, color: '#49a43b', fontWeight: '600' },
  weightValue: { fontSize: 20, fontWeight: '700', color: '#1C2B1E' },
  weightDate: { fontSize: 12, fontWeight: '400', color: '#5B6B5D' },
  weightForm: { flexDirection: 'row', gap: 10, marginTop: 12 },
  weightInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10, paddingHorizontal: 12 },
  weightInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1C2B1E' },
  weightUnit: { fontSize: 13, color: '#9A9484' },
  saveBtn: { backgroundColor: '#49a43b', borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  weightMsg: { marginTop: 8, fontSize: 12, color: '#49a43b' },
});
