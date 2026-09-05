import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { register, login, saveToken } from '@/lib/api';
import NutriTrackLogo from '@/components/NutriTrackLogo';
import OnboardingModal from '@/components/OnboardingModal';

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function handleSignup() {
    if (!username.trim() || !email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      const token = await login(username.trim(), password);
      await saveToken(token);
      // Show onboarding modal instead of going straight to dashboard
      setShowOnboarding(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    router.replace('/(tabs)/');
  }

  return (
    <>
      <OnboardingModal visible={showOnboarding} onComplete={handleOnboardingComplete} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <NutriTrackLogo size={64} showText />
            <Text style={styles.subtitle}>Start tracking your macros today.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="choose a username"
                placeholderTextColor="#9A9484"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor="#9A9484"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="min 8 characters"
                placeholderTextColor="#9A9484"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Create account</Text>
              }
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.link}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const PRIMARY = '#49a43b';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F6F3EC' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoSection: { alignItems: 'center', marginBottom: 32, gap: 8 },
  subtitle: { fontSize: 14, color: '#5B6B5D' },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1, borderColor: '#E7E2D6',
    padding: 24, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: '#1C2B1E' },
  input: {
    borderWidth: 1, borderColor: '#DDD7C7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1C2B1E', backgroundColor: '#fff',
  },
  error: { fontSize: 13, color: '#B3401E' },
  btn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#5B6B5D', fontSize: 13 },
  link: { color: PRIMARY, fontWeight: '600', fontSize: 13 },
});
