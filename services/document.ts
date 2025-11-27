import { Category } from '@/types/category';
import { Document } from '@/types/document';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};



export type DocumentWithCategories = Document & { categories: Category[] };

export interface DocumentData {
  title: string;
  description: string;
  keywords: string;
}

export const getDocuments = async (userId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(error.message);
  }

  return data as Document[];
};

export const getDocumentById = async (id: string): Promise<DocumentWithCategories> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*, categories(id, name)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching document by id in service:', error);
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Document not found');
  }

  const result = { ...data, categories: Array.isArray(data.categories) ? data.categories : [] };
  return result as DocumentWithCategories;
};

export const getCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(error.message);
    }
    return data;
}

export const deleteDocument = async (document: { id: string, file_url: string }): Promise<void> => {
    const urlParts = document.file_url.split('/');
    const filePath = urlParts.slice(urlParts.length - 2).join('/');
    
    if (filePath) {
        const { error: storageError } = await supabase.storage.from('documents').remove([filePath]);
        if (storageError) {
            console.error('Error deleting file from storage:', storageError);
        }
    }

    const { error: dbError } = await supabase.from('documents').delete().eq('id', document.id);
    if (dbError) {
        console.error('Error deleting document from database:', dbError);
        throw new Error(dbError.message);
    }
};

export const addDocument = async (
  docData: DocumentData,
  file: { uri: string; mimeType: string; name: string, file?: File },
  categoryIds: number[]
): Promise<Document> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found. Please log in.');

  const fileUrl = await uploadFile(file, user.id);

  const keywordsArray = docData.keywords.split(',').map(k => k.trim()).filter(k => k);
  const { data: newDocument, error: insertError } = await supabase
    .from('documents')
    .insert({ ...docData, keywords: keywordsArray, file_url: fileUrl, user_id: user.id })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  if (!newDocument) throw new Error('Failed to create document.');

  if (categoryIds.length > 0) {
    const links = categoryIds.map(categoryId => ({ document_id: newDocument.id, category_id: categoryId }));
    const { error: catError } = await supabase.from('document_categories').insert(links);
    if (catError) throw new Error('Document created, but failed to link categories.');
  }

  return newDocument as Document;
};

export const updateDocument = async (
    docId: string,
    updates: DocumentData,
    categoryIds: number[],
    newFile?: { uri: string; mimeType: string; name: string, file?: File }
): Promise<Document> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found.');

    let fileUrl: string | undefined = undefined;

    if (newFile) {
        const { data: oldDoc } = await supabase.from('documents').select('file_url').eq('id', docId).single();
        fileUrl = await uploadFile(newFile, user.id);
        if (oldDoc?.file_url) {
            const oldPath = oldDoc.file_url.split('/').slice(-2).join('/');
            await supabase.storage.from('documents').remove([oldPath]);
        }
    }
    
    const keywordsArray = updates.keywords.split(',').map(k => k.trim()).filter(k => k);
    const { data: updatedDocument, error: updateError } = await supabase
        .from('documents')
        .update({ 
            ...updates, 
            keywords: keywordsArray,
            ...(fileUrl && { file_url: fileUrl }), 
            updated_at: new Date().toISOString(),
        })
        .eq('id', docId)
        .select()
        .single();

    if (updateError) throw new Error(updateError.message);
    if (!updatedDocument) throw new Error('Failed to update document.');

    await supabase.from('document_categories').delete().eq('document_id', docId);
    if (categoryIds.length > 0) {
        const links = categoryIds.map(categoryId => ({ document_id: docId, category_id: categoryId }));
        const { error: catError } = await supabase.from('document_categories').insert(links);
        if (catError) throw new Error('Document updated, but failed to sync categories.');
    }

    return updatedDocument as Document;
};

const uploadFile = async (file: { uri: string; mimeType: string, name:string, file?: File }, userId: string) => {
  const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
  const arrayBuffer = base64ToArrayBuffer(base64);

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage.from('documents').upload(filePath, arrayBuffer, { contentType: file.mimeType });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
  if (!data) throw new Error('Could not get public URL for uploaded file.');

  return data.publicUrl;
};
