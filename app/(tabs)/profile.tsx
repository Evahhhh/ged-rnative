import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/Auth';
import React from 'react';
import { StyleSheet, Button, View, Alert } from 'react-native';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Erreur', "Une erreur est survenue lors de la déconnexion.");
    }
    // La redirection est gérée automatiquement par le RootLayout
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Profil Utilisateur</ThemedText>
      <View style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold">Email :</ThemedText>
        <ThemedText>{session?.user?.email}</ThemedText>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Déconnexion" onPress={handleLogout} color="red" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  infoContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonContainer: {
    marginTop: 30,
  }
});
