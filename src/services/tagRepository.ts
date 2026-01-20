import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';
import { Tag, CreateTagInput, UpdateTagInput } from '@/types';
import { TagRow } from '@/types/database';

function mapRowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.created_at),
  };
}

class TagRepository {
  private static instance: TagRepository;

  static getInstance(): TagRepository {
    if (!TagRepository.instance) {
      TagRepository.instance = new TagRepository();
    }
    return TagRepository.instance;
  }

  async getAll(): Promise<Tag[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<TagRow>(
      'SELECT * FROM tags ORDER BY name ASC'
    );

    return rows.map(mapRowToTag);
  }

  async getById(id: string): Promise<Tag | null> {
    const db = databaseService.getDatabase();

    const row = await db.getFirstAsync<TagRow>(
      'SELECT * FROM tags WHERE id = ?',
      [id]
    );

    return row ? mapRowToTag(row) : null;
  }

  async getByName(name: string): Promise<Tag | null> {
    const db = databaseService.getDatabase();

    const row = await db.getFirstAsync<TagRow>(
      'SELECT * FROM tags WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    return row ? mapRowToTag(row) : null;
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const db = databaseService.getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Check if tag with same name already exists
    const existing = await this.getByName(input.name);
    if (existing) {
      throw new Error('A tag with this name already exists');
    }

    await db.runAsync(
      'INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      [id, input.name.toLowerCase().trim(), input.color, now]
    );

    const tag = await this.getById(id);
    if (!tag) {
      throw new Error('Failed to create tag');
    }

    return tag;
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    const db = databaseService.getDatabase();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Tag not found');
    }

    const updates: string[] = [];
    const values: string[] = [];

    if (input.name !== undefined) {
      // Check if another tag with the same name exists
      const nameConflict = await this.getByName(input.name);
      if (nameConflict && nameConflict.id !== id) {
        throw new Error('A tag with this name already exists');
      }
      updates.push('name = ?');
      values.push(input.name.toLowerCase().trim());
    }

    if (input.color !== undefined) {
      updates.push('color = ?');
      values.push(input.color);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update tag');
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();

    // Delete tag (cascade will remove entry_tags relationships)
    await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
  }

  async getTagsForEntry(entryId: string): Promise<Tag[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<TagRow>(
      `SELECT t.* FROM tags t
       JOIN entry_tags et ON t.id = et.tag_id
       WHERE et.entry_id = ?
       ORDER BY t.name ASC`,
      [entryId]
    );

    return rows.map(mapRowToTag);
  }

  async addTagToEntry(entryId: string, tagId: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync(
      'INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)',
      [entryId, tagId]
    );
  }

  async removeTagFromEntry(entryId: string, tagId: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync(
      'DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?',
      [entryId, tagId]
    );
  }

  async setTagsForEntry(entryId: string, tagIds: string[]): Promise<void> {
    const db = databaseService.getDatabase();

    // Remove all existing tags
    await db.runAsync('DELETE FROM entry_tags WHERE entry_id = ?', [entryId]);

    // Add new tags
    for (const tagId of tagIds) {
      await db.runAsync(
        'INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)',
        [entryId, tagId]
      );
    }
  }

  async getEntryCountForTag(tagId: string): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM entry_tags et
       JOIN entries e ON et.entry_id = e.id
       WHERE et.tag_id = ? AND e.deleted_at IS NULL`,
      [tagId]
    );

    return result?.count || 0;
  }
}

export const tagRepository = TagRepository.getInstance();
