import { ThemedText } from '@/components/themed-text';
import { addDocument } from '@/services/document';
import { supabase } from '@/services/supabase';
import { Category } from '@/types/category';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddDocumentScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [newCategory, setNewCategory] = useState('');

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      console.error("Erreur lors de la récupération des catégories", error);
    } else {
      setCategories(data);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategory.trim() })
      .select()
      .single();
    
    if (error) {
      Alert.alert('Erreur', 'Cette catégorie existe peut-être déjà.');
    } else if (data) {
      setCategories([...categories, data]);
      setNewCategory('');
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    setSelectedCategories(newSelection);
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Erreur lors de la sélection du fichier :', err);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const handleSubmit = async () => {
    if (!title || !file) {
      Alert.alert('Champs requis', 'Le titre et le fichier sont obligatoires.');
      return;
    }

    setLoading(true);
    try {
      await addDocument(
        { title, description, keywords },
        file,
        Array.from(selectedCategories)
      );

      Alert.alert('Succès', 'Document ajouté avec succès !');
      setTitle('');
      setDescription('');
      setKeywords('');
      setFile(null);
      setSelectedCategories(new Set());
      router.push('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || "Une erreur est survenue lors de l'ajout du document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Ajouter un document</ThemedText>
        
        <ThemedText style={styles.label}>Titre *</ThemedText>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        
        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />

        <ThemedText style={styles.label}>Mots-clés (séparés par virgules)</ThemedText>
        <TextInput style={styles.input} value={keywords} onChangeText={setKeywords} />

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
        <View style={styles.newCategoryContainer}>
            <TextInput style={styles.newCategoryInput} placeholder="Ajouter une catégorie" value={newCategory} onChangeText={setNewCategory} />
            <Button title="+" onPress={handleAddCategory} />
        </View>

        <View style={styles.buttonContainer}>
            <Button title="Sélectionner un fichier *" onPress={selectFile} />
        </View>
        {file && <ThemedText>Fichier : {file.name}</ThemedText>}
        
        <View style={styles.submitButton}>
            <Button title={loading ? "Envoi..." : "Soumettre"} onPress={handleSubmit} disabled={loading} />
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { textAlign: 'center', marginBottom: 20 },
    label: { marginTop: 15, marginBottom: 5, fontWeight: 'bold' },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: 'gray', borderRadius: 4, padding: 10, marginBottom: 10 },
    categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    chip: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 15, marginRight: 8, marginBottom: 8 },
    chipSelected: { backgroundColor: '#007BFF', borderColor: '#007BFF' },
    chipText: { color: '#333' },
    chipTextSelected: { color: 'white' },
    newCategoryContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    newCategoryInput: { 
        flex: 1, 
        marginRight: 10, 
        backgroundColor: 'white', 
        borderWidth: 1, 
        borderColor: 'gray', 
        borderRadius: 4, 
        padding: 10, 
        marginBottom: 10 
    },
    buttonContainer: { marginVertical: 15 },
    submitButton: { marginTop: 20, marginBottom: 50 }
});
