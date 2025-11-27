import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, Button, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { getDocumentById, getCategories, updateDocument, DocumentWithCategories } from '@/services/document';
import * as DocumentPicker from 'expo-document-picker';
import { Category } from '@/types/category';
import { Image } from 'expo-image';

export default function DocumentEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [newFile, setNewFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [docData, allCategories] = await Promise.all([
          getDocumentById(id),
          getCategories(),
        ]);
        
        setTitle(docData.title);
        setDescription(docData.description || '');
        setKeywords(docData.keywords?.join(', ') || '');
        setCurrentFileUrl(docData.file_url);
        setCategories(allCategories);
        setSelectedCategories(new Set(docData.categories.map(c => c.id)));

      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger les données pour la modification.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);
  
  const toggleCategory = (categoryId: number) => {
    const newSelection = new Set(selectedCategories);
    newSelection.has(categoryId) ? newSelection.delete(categoryId) : newSelection.add(categoryId);
    setSelectedCategories(newSelection);
  };

  const selectFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled === false) {
      setNewFile(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (!title || !id) return;

    setSaving(true);
    try {
      await updateDocument(
        id,
        { title, description, keywords },
        Array.from(selectedCategories),
        newFile ?? undefined
      );

      Alert.alert('Succès', 'Document mis à jour.');
      router.push(`/document/${id}`); // Go back to detail screen
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le document.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ThemedView style={styles.centered}><ActivityIndicator size="large" /></ThemedView>;
  }

  const isImage = currentFileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null;

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title">Modifier le document</ThemedText>
      
      <ThemedText style={styles.label}>Titre</ThemedText>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <ThemedText style={styles.label}>Description</ThemedText>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />

      <ThemedText style={styles.label}>Mots-clés (séparés par virgule)</ThemedText>
      <TextInput style={styles.input} value={keywords} onChangeText={setKeywords} />

      <ThemedText style={styles.label}>Fichier actuel</ThemedText>
      {isImage && <Image source={{ uri: currentFileUrl }} style={styles.imagePreview} />}
      <Button title="Remplacer le fichier" onPress={selectFile} />
      {newFile && <ThemedText style={styles.newFileText}>Nouveau fichier : {newFile.name}</ThemedText>}


      <ThemedText style={styles.label}>Catégories</ThemedText>
      <View style={styles.categoriesContainer}>
          {categories.map(cat => (
              <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selectedCategories.has(cat.id) && styles.chipSelected]}
                  onPress={() => toggleCategory(cat.id)}
              >
                  <ThemedText style={selectedCategories.has(cat.id) ? styles.chipTextSelected : styles.chipText}>
                      {cat.name}
                  </ThemedText>
              </TouchableOpacity>
          ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title={saving ? "Sauvegarde..." : "Sauvegarder les modifications"} onPress={handleUpdate} disabled={saving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  label: { marginTop: 20, marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: 'gray', borderRadius: 4, padding: 10, marginBottom: 10 },
  buttonContainer: { marginTop: 30, marginBottom: 50 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, marginTop: 5 },
  chip: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 15, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#007BFF', borderColor: '#007BFF' },
  chipText: { color: '#333' },
  chipTextSelected: { color: 'white' },
  imagePreview: { width: 100, height: 100, marginBottom: 10, backgroundColor: '#eee' },
  newFileText: { marginTop: 10, fontStyle: 'italic' },
});
