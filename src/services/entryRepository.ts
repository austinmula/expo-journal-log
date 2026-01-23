import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';
import { JournalEntry, CreateEntryInput, UpdateEntryInput, Tag, MoodType, SyncStatus, Category } from '@/types';
import { EntryRow, TagRow, EntryWithCategoryRow } from '@/types/database';

function mapRowToEntry(row: EntryRow, tags: Tag[] = [], category?: Category): JournalEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    mood: row.mood as MoodType | undefined,
    categoryId: row.category_id || undefined,
    category,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    tags,
    syncStatus: row.sync_status as SyncStatus,
    syncVersion: row.sync_version,
  };
}

function mapRowWithCategoryToEntry(row: EntryWithCategoryRow, tags: Tag[] = []): JournalEntry {
  const category: Category | undefined = row.category_id && row.category_name
    ? {
        id: row.category_id,
        name: row.category_name,
        icon: row.category_icon || undefined,
        color: row.category_color || '#6366F1',
        sortOrder: row.category_sort_order || 0,
        createdAt: row.category_created_at ? new Date(row.category_created_at) : new Date(),
      }
    : undefined;

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    mood: row.mood as MoodType | undefined,
    categoryId: row.category_id || undefined,
    category,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    tags,
    syncStatus: row.sync_status as SyncStatus,
    syncVersion: row.sync_version,
  };
}

function mapRowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.created_at),
  };
}

class EntryRepository {
  private static instance: EntryRepository;

  static getInstance(): EntryRepository {
    if (!EntryRepository.instance) {
      EntryRepository.instance = new EntryRepository();
    }
    return EntryRepository.instance;
  }

  async getAll(): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.deleted_at IS NULL
       ORDER BY e.created_at DESC`
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowWithCategoryToEntry(row, tags));
    }

    return entries;
  }

  async getById(id: string): Promise<JournalEntry | null> {
    const db = databaseService.getDatabase();

    const row = await db.getFirstAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [id]
    );

    if (!row) {
      return null;
    }

    const tags = await this.getTagsForEntry(id);
    return mapRowWithCategoryToEntry(row, tags);
  }

  async create(input: CreateEntryInput): Promise<JournalEntry> {
    const db = databaseService.getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO entries (id, title, content, mood, category_id, created_at, updated_at, sync_status, sync_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [id, input.title, input.content, input.mood || null, input.categoryId || null, now, now]
    );

    // Add tags if provided
    if (input.tagIds && input.tagIds.length > 0) {
      for (const tagId of input.tagIds) {
        await this.addTagToEntry(id, tagId);
      }
    }

    const entry = await this.getById(id);
    if (!entry) {
      throw new Error('Failed to create entry');
    }

    return entry;
  }

  async update(id: string, input: UpdateEntryInput): Promise<JournalEntry> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const existingEntry = await this.getById(id);
    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }

    if (input.content !== undefined) {
      updates.push('content = ?');
      values.push(input.content);
    }

    if (input.mood !== undefined) {
      updates.push('mood = ?');
      values.push(input.mood || null);
    }

    if (input.categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(input.categoryId || null);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      updates.push("sync_status = 'pending'");
      updates.push('sync_version = sync_version + 1');
      values.push(id);

      await db.runAsync(
        `UPDATE entries SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update tags if provided
    if (input.tagIds !== undefined) {
      await db.runAsync('DELETE FROM entry_tags WHERE entry_id = ?', [id]);
      for (const tagId of input.tagIds) {
        await this.addTagToEntry(id, tagId);
      }
    }

    const updatedEntry = await this.getById(id);
    if (!updatedEntry) {
      throw new Error('Failed to update entry');
    }

    return updatedEntry;
  }

  async softDelete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE entries
       SET deleted_at = ?, sync_status = 'pending', sync_version = sync_version + 1
       WHERE id = ?`,
      [now, id]
    );
  }

  async restore(id: string): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync(
      `UPDATE entries
       SET deleted_at = NULL, sync_status = 'pending', sync_version = sync_version + 1
       WHERE id = ?`,
      [id]
    );
  }

  async permanentDelete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
  }

  async getDeleted(): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.deleted_at IS NOT NULL
       ORDER BY e.deleted_at DESC`
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowWithCategoryToEntry(row, tags));
    }

    return entries;
  }

  async purgeOldDeleted(daysOld: number = 30): Promise<number> {
    const db = databaseService.getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.runAsync(
      'DELETE FROM entries WHERE deleted_at < ?',
      [cutoffDate.toISOString()]
    );

    return result.changes;
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.deleted_at IS NULL
       AND e.created_at >= ? AND e.created_at <= ?
       ORDER BY e.created_at DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowWithCategoryToEntry(row, tags));
    }

    return entries;
  }

  async getByTag(tagId: string): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       JOIN entry_tags et ON e.id = et.entry_id
       WHERE et.tag_id = ? AND e.deleted_at IS NULL
       ORDER BY e.created_at DESC`,
      [tagId]
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowWithCategoryToEntry(row, tags));
    }

    return entries;
  }

  async getByMood(mood: MoodType): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.mood = ? AND e.deleted_at IS NULL
       ORDER BY e.created_at DESC`,
      [mood]
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowWithCategoryToEntry(row, tags));
    }

    return entries;
  }

  async getByCategory(categoryId: string): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<EntryWithCategoryRow>(
      `SELECT e.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              c.sort_order as category_sort_order,
              c.created_at as category_created_at
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.category_id = ? AND e.deleted_at IS NULL
       ORDER BY e.created_at DESC`,
      [categoryId]
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowWithCategoryToEntry(row, tags));
    }

    return entries;
  }

  private async getTagsForEntry(entryId: string): Promise<Tag[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<TagRow>(
      `SELECT t.* FROM tags t
       JOIN entry_tags et ON t.id = et.tag_id
       WHERE et.entry_id = ?`,
      [entryId]
    );

    return rows.map(mapRowToTag);
  }

  private async addTagToEntry(entryId: string, tagId: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync(
      'INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)',
      [entryId, tagId]
    );
  }
}

export const entryRepository = EntryRepository.getInstance();
