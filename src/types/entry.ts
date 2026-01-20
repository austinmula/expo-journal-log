export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: MoodType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  tags: Tag[];
  syncStatus: SyncStatus;
  syncVersion: number;
}

export interface CreateEntryInput {
  title: string;
  content: string;
  mood?: MoodType;
  tagIds?: string[];
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  mood?: MoodType;
  tagIds?: string[];
}

export interface CreateTagInput {
  name: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}
