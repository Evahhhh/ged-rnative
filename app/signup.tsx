import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/Auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, TextInput, View } from 'react-native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, loading } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    const { data, error } = await signUp(email, password);
    if (error) {
      Alert.alert("Erreur d'inscription", error.message);
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        Alert.alert("Erreur", "Un utilisateur avec cet email existe déjà.");
    }
     else {
      Alert.alert(
        'Inscription réussie !',
        'Veuillez vérifier votre boîte de réception pour confirmer votre adresse e-mail.'
      );
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Créer un compte</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (minimum 6 caractères)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Button title="S'inscrire" onPress={handleSignUp} />
          </View>
          <View style={styles.linkContainer}>
            <ThemedText type="link" onPress={() => router.back()}>
              Déjà un compte ? Se connecter
            </ThemedText>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginTop: 10,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  }
});
