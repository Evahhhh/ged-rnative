import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/Auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, Button, Linking, ScrollView, TouchableOpacity } from 'react-native';
import { getDocumentById, deleteDocument, DocumentWithCategories } from '@/services/document';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentWithCategories | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getDocumentById(id);
      setDocument(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le document.');
      console.error("Error loading document:", error);
      // router.back(); // Temporarily disabled for debugging
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!document) {
      fetchDocument();
    }
  }, [id, document, fetchDocument]);

  const handleDelete = async () => {
    if (!document) return;

    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(document);
              Alert.alert('Succès', 'Le document a été supprimé.');
              router.push('/(tabs)');
            } catch (error) {
              Alert.alert('Erreur', "Impossible de supprimer le document.");
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!document) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Document non trouvé.</ThemedText>
      </ThemedView>
    );
  }

  const isOwner = user?.id === document.user_id;
  const isImage = document.file_url.match(/\.(jpeg|jpg|gif|png)$/) != null;

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>{document.title}</ThemedText>
      
      {isImage ? (
          <Image source={{ uri: document.file_url }} style={styles.imagePreview} />
        ) : (
          <View style={styles.fileDownloadCard}>
            <Ionicons name="document-text-outline" size={24} color="#0a7ea4" />
            <ThemedText>Fichier non image</ThemedText>
            <Button title="Télécharger" onPress={() => Linking.openURL(document.file_url)} />
          </View>
        )}
      
      {isOwner && (
        <View style={styles.ownerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/document/edit/${document.id}`)}>
            <Ionicons name="pencil" size={16} color="white" />
            <ThemedText style={styles.actionButtonText}>Modifier</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
             <Ionicons name="trash" size={16} color="white" />
            <ThemedText style={styles.actionButtonText}>Supprimer</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <ThemedText type="subtitle">Description</ThemedText>
        <ThemedText style={styles.cardBody}>{document.description || 'Aucune description.'}</ThemedText>
      </View>

       <View style={styles.card}>
        <ThemedText type="subtitle">Mots-clés & Catégories</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.label}>Mots-clés:</ThemedText>
        <ThemedText style={styles.cardBody}>{document.keywords?.join(', ') || 'N/A'}</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.label}>Catégories:</ThemedText>
        <View style={styles.categoriesContainer}>
          {document.categories.length > 0 ? document.categories.map(cat => (
            <View key={cat.id} style={styles.chip}>
              <ThemedText style={styles.chipText}>{cat.name}</ThemedText>
            </View>
          )) : <ThemedText>N/A</ThemedText>}
        </View>
      </View>
      
      <View style={styles.card}>
        <ThemedText type="subtitle">Informations</ThemedText>
         <ThemedText style={styles.label}>Ajouté le:</ThemedText>
        <ThemedText style={styles.cardBody}>{new Date(document.created_at).toLocaleString()}</ThemedText>
        <ThemedText style={styles.label}>Dernière modification:</ThemedText>
        <ThemedText style={styles.cardBody}>{new Date(document.updated_at).toLocaleString()}</ThemedText>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  title: {
    padding: 20,
    backgroundColor: 'white',
    textAlign: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 250,
  },
  fileDownloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
  },
  cardBody: {
    marginTop: 5,
    color: '#333'
  },
  label: {
      marginTop: 10,
      color: '#555',
  },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#495057',
  },
});
