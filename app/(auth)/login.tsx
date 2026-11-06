import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Field } from '../../src/components/Field';
import { Button } from '../../src/components/Button';
import { useSession } from '../../src/context/SessionContext';
import { colors, type } from '../../src/theme';

export default function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ paddingTop: 48 }}>
      <View style={{ gap: 4, marginBottom: 16 }}>
        <Text style={type.title}>MacroTrack</Text>
        <Text style={type.small}>Sign in to log today's meals.</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      </View>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title="Sign in" onPress={submit} loading={busy} />
      <Link href="/register" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', padding: 8 }}>
        New here? Create an account
      </Link>
    </Screen>
  );
}
