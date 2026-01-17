import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { runnerTheme } from '@/constants/theme';
import { 
  createJournalRecord, 
  updateJournalRecord, 
  deleteJournalRecord,
  getJournalById,
} from '@/lib/hooks';
import { Ionicons } from '@expo/vector-icons';

export default function JournalEditorScreen() {
  const { id, runId } = useLocalSearchParams<{ id: string; runId: string }>();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [journalId, setJournalId] = useState<string | null>(id === 'new' ? null : id);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNewJournal = id === 'new';

  useEffect(() => {
    if (!isNewJournal && id) {
      // Load existing journal
      const loadJournal = async () => {
        const journal = await getJournalById(id);
        if (journal) {
          setContent(journal.content);
        }
      };
      loadJournal();
    }
  }, [id, isNewJournal]);

  useEffect(() => {
    // Auto-save logic
    if (!runId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (content.trim().length === 0) return;

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        if (!journalId) {
          // Create new journal
          const newId = await createJournalRecord(runId, content);
          setJournalId(newId);
          setLastSaved(new Date());
        } else {
          // Update existing journal
          await updateJournalRecord(journalId, content);
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error saving journal:', error);
      } finally {
        setSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, runId, journalId]);

  const handleDelete = () => {
    if (!journalId) {
      router.back();
      return;
    }

    Alert.alert('Delete Journal', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteJournalRecord(journalId);
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete journal');
            console.error('Error deleting journal:', error);
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    if (content.trim().length === 0 && isNewJournal) {
      router.back();
      return;
    }

    if (saving) {
      Alert.alert('Saving', 'Please wait while your journal is being saved');
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={28} color={runnerTheme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Journal</Text>
            {lastSaved && (
              <Text style={styles.savedText}>
                Saved {lastSaved.toLocaleTimeString()}
              </Text>
            )}
            {saving && <Text style={styles.savingText}>Saving...</Text>}
          </View>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={runnerTheme.colors.error} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.textInput}
          value={content}
          onChangeText={setContent}
          placeholder="Write your thoughts about this run..."
          placeholderTextColor={runnerTheme.colors.textSecondary}
          multiline
          autoFocus
          textAlignVertical="top"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: runnerTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: runnerTheme.spacing.lg,
    paddingVertical: runnerTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: runnerTheme.colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: runnerTheme.fontSize.lg,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
  },
  savedText: {
    fontSize: runnerTheme.fontSize.xs,
    color: runnerTheme.colors.accent,
    marginTop: 2,
  },
  savingText: {
    fontSize: runnerTheme.fontSize.xs,
    color: runnerTheme.colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    padding: runnerTheme.spacing.lg,
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
