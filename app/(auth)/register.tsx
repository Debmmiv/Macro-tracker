import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Logo } from '../../src/components/Logo';
import { Field } from '../../src/components/Field';
import { Button } from '../../src/components/Button';
import { useSession } from '../../src/context/SessionContext';
import { colors, type } from '../../src/theme';

export default function Register() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError('Enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp(email, password, name);
      if (needsConfirmation) setNotice('Check your email to confirm your account, then sign in.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ paddingTop: 48 }}>
      <View style={{ alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <Logo size={72} style={{ marginBottom: 8 }} />
        <Text style={type.title}>Create your account</Text>
        <Text style={[type.small, { textAlign: 'center' }]}>It takes about a minute to set your daily targets.</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      </View>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {notice ? <Text style={{ color: colors.primary }}>{notice}</Text> : null}
      <Button title="Create account" onPress={submit} loading={busy} />
      <Link href="/login" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', padding: 8 }}>
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}
