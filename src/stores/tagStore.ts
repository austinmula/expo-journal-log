import { create } from 'zustand';
import { tagRepository } from '@/services/tagRepository';
import { Tag, CreateTagInput, UpdateTagInput } from '@/types';

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTags: () => Promise<void>;
  createTag: (input: CreateTagInput) => Promise<Tag>;
  updateTag: (id: string, input: UpdateTagInput) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  getTagById: (id: string) => Tag | undefined;
  addTagToEntry: (entryId: string, tagId: string) => Promise<void>;
  removeTagFromEntry: (entryId: string, tagId: string) => Promise<void>;
  setTagsForEntry: (entryId: string, tagIds: string[]) => Promise<void>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  loadTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await tagRepository.getAll();
      set({ tags, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load tags',
        isLoading: false,
      });
    }
  },

  createTag: async (input) => {
    set({ error: null });
    try {
      const tag = await tagRepository.create(input);
      set((state) => ({
        tags: [...state.tags, tag].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      return tag;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tag';
      set({ error: message });
      throw error;
    }
  },

  updateTag: async (id, input) => {
    set({ error: null });
    try {
      const tag = await tagRepository.update(id, input);
      set((state) => ({
        tags: state.tags
          .map((t) => (t.id === id ? tag : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
      return tag;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update tag';
      set({ error: message });
      throw error;
    }
  },

  deleteTag: async (id) => {
    set({ error: null });
    try {
      await tagRepository.delete(id);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete tag';
      set({ error: message });
      throw error;
    }
  },

  getTagById: (id) => {
    return get().tags.find((t) => t.id === id);
  },

  addTagToEntry: async (entryId, tagId) => {
    try {
      await tagRepository.addTagToEntry(entryId, tagId);
    } catch (error) {
      console.error('Failed to add tag to entry:', error);
      throw error;
    }
  },

  removeTagFromEntry: async (entryId, tagId) => {
    try {
      await tagRepository.removeTagFromEntry(entryId, tagId);
    } catch (error) {
      console.error('Failed to remove tag from entry:', error);
      throw error;
    }
  },

  setTagsForEntry: async (entryId, tagIds) => {
    try {
      await tagRepository.setTagsForEntry(entryId, tagIds);
    } catch (error) {
      console.error('Failed to set tags for entry:', error);
      throw error;
    }
  },
}));
