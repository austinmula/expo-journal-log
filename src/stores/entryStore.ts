import { create } from 'zustand';
import { entryRepository } from '@/services/entryRepository';
import { JournalEntry, CreateEntryInput, UpdateEntryInput, MoodType } from '@/types';

interface EntryState {
  entries: JournalEntry[];
  deletedEntries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  selectedTagId: string | null;
  selectedMood: MoodType | null;
  selectedCategoryId: string | null;

  // Actions
  loadEntries: () => Promise<void>;
  loadDeletedEntries: () => Promise<void>;
  createEntry: (input: CreateEntryInput) => Promise<JournalEntry>;
  updateEntry: (id: string, input: UpdateEntryInput) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  permanentlyDeleteEntry: (id: string) => Promise<void>;
  purgeOldDeleted: (daysOld?: number) => Promise<number>;
  getEntryById: (id: string) => JournalEntry | undefined;
  setSelectedTag: (tagId: string | null) => void;
  setSelectedMood: (mood: MoodType | null) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  clearFilters: () => void;
}

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  deletedEntries: [],
  isLoading: false,
  error: null,
  selectedTagId: null,
  selectedMood: null,
  selectedCategoryId: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await entryRepository.getAll();
      set({ entries, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load entries',
        isLoading: false,
      });
    }
  },

  loadDeletedEntries: async () => {
    try {
      const deletedEntries = await entryRepository.getDeleted();
      set({ deletedEntries });
    } catch (error) {
      console.error('Failed to load deleted entries:', error);
    }
  },

  createEntry: async (input) => {
    set({ error: null });
    try {
      const entry = await entryRepository.create(input);
      set((state) => ({
        entries: [entry, ...state.entries],
      }));
      return entry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create entry';
      set({ error: message });
      throw error;
    }
  },

  updateEntry: async (id, input) => {
    set({ error: null });
    try {
      const entry = await entryRepository.update(id, input);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? entry : e)),
      }));
      return entry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update entry';
      set({ error: message });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set({ error: null });
    try {
      await entryRepository.softDelete(id);
      const entry = get().entries.find((e) => e.id === id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        deletedEntries: entry
          ? [{ ...entry, deletedAt: new Date() }, ...state.deletedEntries]
          : state.deletedEntries,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete entry';
      set({ error: message });
      throw error;
    }
  },

  restoreEntry: async (id) => {
    set({ error: null });
    try {
      await entryRepository.restore(id);
      const entry = get().deletedEntries.find((e) => e.id === id);
      if (entry) {
        const restoredEntry = { ...entry, deletedAt: undefined };
        set((state) => ({
          deletedEntries: state.deletedEntries.filter((e) => e.id !== id),
          entries: [restoredEntry, ...state.entries].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          ),
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore entry';
      set({ error: message });
      throw error;
    }
  },

  permanentlyDeleteEntry: async (id) => {
    set({ error: null });
    try {
      await entryRepository.permanentDelete(id);
      set((state) => ({
        deletedEntries: state.deletedEntries.filter((e) => e.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to permanently delete entry';
      set({ error: message });
      throw error;
    }
  },

  purgeOldDeleted: async (daysOld = 30) => {
    try {
      const count = await entryRepository.purgeOldDeleted(daysOld);
      await get().loadDeletedEntries();
      return count;
    } catch (error) {
      console.error('Failed to purge old deleted entries:', error);
      return 0;
    }
  },

  getEntryById: (id) => {
    return get().entries.find((e) => e.id === id);
  },

  setSelectedTag: (tagId) => {
    set({ selectedTagId: tagId });
  },

  setSelectedMood: (mood) => {
    set({ selectedMood: mood });
  },

  setSelectedCategory: (categoryId) => {
    set({ selectedCategoryId: categoryId });
  },

  clearFilters: () => {
    set({ selectedTagId: null, selectedMood: null, selectedCategoryId: null });
  },
}));

// Selector hooks for filtered entries
export const useFilteredEntries = () => {
  const { entries, selectedTagId, selectedMood, selectedCategoryId } = useEntryStore();

  return entries.filter((entry) => {
    if (selectedTagId && !entry.tags.some((t) => t.id === selectedTagId)) {
      return false;
    }
    if (selectedMood && entry.mood !== selectedMood) {
      return false;
    }
    if (selectedCategoryId && entry.categoryId !== selectedCategoryId) {
      return false;
    }
    return true;
  });
};
