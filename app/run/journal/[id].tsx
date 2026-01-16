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
import { useAuth } from '@/lib/auth-context';
import {
  createJournal,
  updateJournal,
  deleteJournal,
  getRunMoment,
} from '@/lib/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function JournalEditorScreen() {
  const { id, runId } = useLocalSearchParams<{ id: string; runId: string }>();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNewJournal = id === 'new';

  useEffect(() => {
    if (!isNewJournal && user && id && runId) {
      // Load existing journal
      getRunMoment(user.uid, runId)
        .collection('journals')
        .doc(id)
        .get()
        .then((doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setContent(data?.content || '');
          }
        });
    }
  }, [id, runId, user, isNewJournal]);

  useEffect(() => {
    // Auto-save logic
    if (!user || !runId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (content.trim().length === 0) return;

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        if (isNewJournal) {
          const journalId = await createJournal(user.uid, runId, content);
          setLastSaved(new Date());
          // Update URL to reflect the created journal
          router.replace(`/run/journal/${journalId}?runId=${runId}`);
        } else {
          await updateJournal(user.uid, runId, id, content);
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
  }, [content, user, runId, id, isNewJournal]);

  const handleDelete = () => {
    if (isNewJournal) {
      router.back();
      return;
    }

    Alert.alert('Delete Journal', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user || !runId) return;
          try {
            await deleteJournal(user.uid, runId, id);
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
