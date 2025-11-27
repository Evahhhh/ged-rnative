import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/services/supabase';
import { Document } from '@/types/document';

export default function ExploreScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = async () => {
    if (refreshing) return; // Don't fetch if already refreshing
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        // Sanitize the search query to build a valid tsquery.
        // 1. Trim whitespace from the query.
        // 2. Split the query into individual words.
        // 3. For each word, append ':*' to enable prefix matching (e.g., 'doc' finds 'document').
        // 4. Join the words with '&' so all words must appear in the result.
        const tsquery = searchQuery
          .trim()
          .split(/\s+/)
          .filter(Boolean) // Remove empty strings that can result from multiple spaces
          .map(term => term + ':*')
          .join(' & ');
        
        if (tsquery) {
            query = query.textSearch('title_description', tsquery, {
                type: 'tsquery',
                config: 'french' // Specify french dictionary for better search
            });
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setDocuments(data as Document[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments();
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  
  const onRefresh = () => {
      setRefreshing(true);
      setSearchQuery(''); // Also clear search on refresh
      fetchDocuments();
  }

  const renderItem = ({ item }: { item: Document }) => (
    <Link href={`/document/${item.id}`} asChild>
        <TouchableOpacity style={styles.itemContainer}>
            <ThemedText type="subtitle">{item.title}</ThemedText>
            <ThemedText style={styles.description}>{item.description}</ThemedText>
        </TouchableOpacity>
    </Link>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Explorer les documents</ThemedText>
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher par titre ou description..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : error ? (
        <ThemedText style={styles.errorText}>Erreur: {error}</ThemedText>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>Aucun document trouvé.</ThemedText>}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    textAlign: 'center',
    marginVertical: 10,
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  list: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  description: {
    marginTop: 5,
    color: '#555',
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  }
});
