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
import { useTheme } from '@/lib/theme';
import { ReflectionEngine } from '@/lib/reflection';
import { 
  createJournalRecord, 
  updateJournalRecord, 
  deleteJournalRecord,
  getJournalById,
} from '@/lib/hooks';
import { db } from '@/lib/db/client';
import { runMoments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';

export default function JournalEditorScreen() {
  const { id, runId } = useLocalSearchParams<{ id: string; runId: string }>();
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [journalId, setJournalId] = useState<string | null>(id === 'new' ? null : id);
  const [vibePlaceholder, setVibePlaceholder] = useState('Write your thoughts about this run...');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNewJournal = id === 'new';

  // Load vibe prompt based on run context
  useEffect(() => {
    if (runId) {
      const loadVibePrompt = async () => {
        try {
          const [runMoment] = await db
            .select()
            .from(runMoments)
            .where(eq(runMoments.id, runId))
            .limit(1);
          
          if (runMoment) {
            const context = ReflectionEngine.buildContext(runMoment);
            const prompt = ReflectionEngine.generateVibePrompt(context);
            setVibePlaceholder(prompt);
          }
        } catch (error) {
          console.error('Error loading vibe prompt:', error);
        }
      };
      loadVibePrompt();
    }
  }, [runId]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={28} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Journal</Text>
            {lastSaved && (
              <Text style={[styles.savedText, { color: theme.colors.accent }]}>
                Saved {lastSaved.toLocaleTimeString()}
              </Text>
            )}
            {saving && <Text style={[styles.savingText, { color: theme.colors.textSecondary }]}>Saving...</Text>}
          </View>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.textInput, { color: theme.colors.textPrimary }]}
          value={content}
          onChangeText={setContent}
          placeholder={vibePlaceholder}
          placeholderTextColor={theme.colors.textSecondary}
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
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  savedText: {
    fontSize: 11,
    marginTop: 2,
  },
  savingText: {
    fontSize: 11,
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    padding: 24,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
