import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/context/SessionContext';
import { Logo } from '../src/components/Logo';
import { colors } from '../src/theme';

function Gate() {
  const { session, profile, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0] as string | undefined;
    const inAuth = first === '(auth)';
    const inOnboarding = first === 'onboarding';
    if (!session) {
      if (!inAuth) router.replace('/login');
    } else if (!profile?.onboarding_completed) {
      if (!inOnboarding) router.replace('/onboarding');
    } else if (inAuth || inOnboarding) {
      router.replace('/');
    }
  }, [loading, session, profile, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="food-form" options={{ presentation: 'modal' }} />
      </Stack>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <Logo size={88} style={{ marginBottom: 24 }} />
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Gate />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
