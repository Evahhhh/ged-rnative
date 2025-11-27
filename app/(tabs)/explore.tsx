import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

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
    if (refreshing) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        const tsquery = searchQuery
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(term => term + ':*')
          .join(' & ');
        
        if (tsquery) {
            query = query.textSearch('title_description', tsquery, {
                type: 'tsquery',
                config: 'french' 
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

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments();
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  
  const onRefresh = () => {
      setRefreshing(true);
      setSearchQuery(''); 
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
