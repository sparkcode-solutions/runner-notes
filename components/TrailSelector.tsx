import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { runnerTheme } from '../constants/theme';
import { useAuth } from '../lib/auth-context';
import { getTrails, createTrail, type Trail } from '../lib/firestore';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Ionicons } from '@expo/vector-icons';

interface TrailSelectorProps {
  selectedTrailId: string | null;
  selectedTrailName: string | null;
  onSelectTrail: (trailId: string, trailName: string) => void;
}

export const TrailSelector: React.FC<TrailSelectorProps> = ({
  selectedTrailId,
  selectedTrailName,
  onSelectTrail,
}) => {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [newTrailName, setNewTrailName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = getTrails(user.uid).onSnapshot((snapshot) => {
      const trailsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trail[];
      setTrails(trailsList);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSelectTrail = (trail: Trail) => {
    onSelectTrail(trail.id, trail.name);
    setModalVisible(false);
  };

  const handleCreateTrail = async () => {
    if (!user || !newTrailName.trim()) {
      Alert.alert('Error', 'Please enter a trail name');
      return;
    }

    setCreating(true);
    try {
      const trailId = await createTrail(user.uid, newTrailName.trim());
      onSelectTrail(trailId, newTrailName.trim());
      setNewTrailName('');
      setAddingNew(false);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create trail');
      console.error('Error creating trail:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.label}>Trail</Text>
          <Text style={styles.value}>
            {selectedTrailName || 'Select a trail'}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={24}
          color={runnerTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Trail</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={28}
                  color={runnerTheme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {!addingNew ? (
              <>
                <FlatList
                  data={trails}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.trailItem,
                        item.id === selectedTrailId && styles.selectedTrail,
                      ]}
                      onPress={() => handleSelectTrail(item)}
                    >
                      <Text style={styles.trailName}>{item.name}</Text>
                      {item.id === selectedTrailId && (
                        <Ionicons
                          name="checkmark"
                          size={24}
                          color={runnerTheme.colors.accent}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No trails yet</Text>
                  }
                  style={styles.trailList}
                />

                <Button
                  title="Add New Trail"
                  onPress={() => setAddingNew(true)}
                  variant="primary"
                  style={styles.addButton}
                />
              </>
            ) : (
              <View style={styles.addNewContainer}>
                <Input
                  label="Trail Name"
                  placeholder="Enter trail name"
                  value={newTrailName}
                  onChangeText={setNewTrailName}
                  autoFocus
                />
                <View style={styles.addNewButtons}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setAddingNew(false);
                      setNewTrailName('');
                    }}
                    variant="secondary"
                    style={styles.addNewButton}
                  />
                  <Button
                    title="Create"
                    onPress={handleCreateTrail}
                    variant="primary"
                    style={styles.addNewButton}
                    loading={creating}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: runnerTheme.colors.surface,
    borderRadius: runnerTheme.borderRadius.md,
    padding: runnerTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: runnerTheme.colors.border,
  },
  label: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
    marginBottom: runnerTheme.spacing.xs,
  },
  value: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: runnerTheme.colors.surface,
    borderTopLeftRadius: runnerTheme.borderRadius.xl,
    borderTopRightRadius: runnerTheme.borderRadius.xl,
    padding: runnerTheme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: runnerTheme.spacing.lg,
  },
  modalTitle: {
    fontSize: runnerTheme.fontSize.xl,
    fontWeight: '700',
    color: runnerTheme.colors.textPrimary,
  },
  trailList: {
    marginBottom: runnerTheme.spacing.md,
  },
  trailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: runnerTheme.spacing.md,
    backgroundColor: runnerTheme.colors.background,
    borderRadius: runnerTheme.borderRadius.md,
    marginBottom: runnerTheme.spacing.sm,
  },
  selectedTrail: {
    borderWidth: 2,
    borderColor: runnerTheme.colors.accent,
  },
  trailName: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: runnerTheme.spacing.xl,
  },
  addButton: {
    marginTop: runnerTheme.spacing.md,
  },
  addNewContainer: {
    paddingVertical: runnerTheme.spacing.md,
  },
  addNewButtons: {
    flexDirection: 'row',
    gap: runnerTheme.spacing.md,
    marginTop: runnerTheme.spacing.md,
  },
  addNewButton: {
    flex: 1,
  },
});
