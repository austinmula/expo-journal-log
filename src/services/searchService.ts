import { databaseService } from './database';
import { JournalEntry, Tag, MoodType, SyncStatus } from '@/types';
import { EntryRow, TagRow, SearchResultRow } from '@/types/database';

function mapRowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.created_at),
  };
}

function mapRowToEntry(row: EntryRow, tags: Tag[] = []): JournalEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    mood: row.mood as MoodType | undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    tags,
    syncStatus: row.sync_status as SyncStatus,
    syncVersion: row.sync_version,
  };
}

export interface SearchResult {
  id: string;
  title: string;
  createdAt: Date;
  snippet: string;
  tags: Tag[];
  mood?: MoodType;
}

export interface SearchFilters {
  tagIds?: string[];
  mood?: MoodType;
  startDate?: Date;
  endDate?: Date;
}

class SearchService {
  private static instance: SearchService;

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Search entries using FTS5 full-text search
   */
  async search(query: string, limit: number = 50): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    if (!query.trim()) {
      return [];
    }

    // Escape special FTS5 characters and prepare query
    const sanitizedQuery = this.sanitizeFtsQuery(query);

    try {
      // Use FTS5 for full-text search with prefix matching
      const rows = await db.getAllAsync<EntryRow>(
        `SELECT entries.* FROM entries
         JOIN entries_fts ON entries.rowid = entries_fts.rowid
         WHERE entries_fts MATCH ?
         AND entries.deleted_at IS NULL
         ORDER BY rank
         LIMIT ?`,
        [`${sanitizedQuery}*`, limit]
      );

      const entries: JournalEntry[] = [];
      for (const row of rows) {
        const tags = await this.getTagsForEntry(row.id);
        entries.push(mapRowToEntry(row, tags));
      }

      return entries;
    } catch (error) {
      console.error('FTS search failed, falling back to LIKE search:', error);
      return this.fallbackSearch(query, limit);
    }
  }

  /**
   * Search with highlighted snippets for display
   */
  async searchWithSnippets(query: string, limit: number = 50): Promise<SearchResult[]> {
    const db = databaseService.getDatabase();

    if (!query.trim()) {
      return [];
    }

    const sanitizedQuery = this.sanitizeFtsQuery(query);

    try {
      const rows = await db.getAllAsync<SearchResultRow & { mood: string | null }>(
        `SELECT entries.id, entries.title, entries.created_at, entries.mood,
                snippet(entries_fts, 1, '<<', '>>', '...', 32) as snippet
         FROM entries
         JOIN entries_fts ON entries.rowid = entries_fts.rowid
         WHERE entries_fts MATCH ?
         AND entries.deleted_at IS NULL
         ORDER BY rank
         LIMIT ?`,
        [`${sanitizedQuery}*`, limit]
      );

      const results: SearchResult[] = [];
      for (const row of rows) {
        const tags = await this.getTagsForEntry(row.id);
        results.push({
          id: row.id,
          title: row.title,
          createdAt: new Date(row.created_at),
          snippet: row.snippet || '',
          tags,
          mood: row.mood as MoodType | undefined,
        });
      }

      return results;
    } catch (error) {
      console.error('FTS search with snippets failed:', error);
      return this.fallbackSearchWithSnippets(query, limit);
    }
  }

  /**
   * Search with filters (tags, mood, date range)
   */
  async searchWithFilters(
    query: string,
    filters: SearchFilters,
    limit: number = 50
  ): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    let baseQuery = `SELECT DISTINCT entries.* FROM entries`;
    const params: (string | number)[] = [];
    const conditions: string[] = ['entries.deleted_at IS NULL'];

    // Add FTS join if query is provided
    if (query.trim()) {
      const sanitizedQuery = this.sanitizeFtsQuery(query);
      baseQuery += ` JOIN entries_fts ON entries.rowid = entries_fts.rowid`;
      conditions.push(`entries_fts MATCH ?`);
      params.push(`${sanitizedQuery}*`);
    }

    // Add tag filter with join
    if (filters.tagIds && filters.tagIds.length > 0) {
      baseQuery += ` JOIN entry_tags ON entries.id = entry_tags.entry_id`;
      const placeholders = filters.tagIds.map(() => '?').join(', ');
      conditions.push(`entry_tags.tag_id IN (${placeholders})`);
      params.push(...filters.tagIds);
    }

    // Add mood filter
    if (filters.mood) {
      conditions.push(`entries.mood = ?`);
      params.push(filters.mood);
    }

    // Add date range filters
    if (filters.startDate) {
      conditions.push(`entries.created_at >= ?`);
      params.push(filters.startDate.toISOString());
    }

    if (filters.endDate) {
      conditions.push(`entries.created_at <= ?`);
      params.push(filters.endDate.toISOString());
    }

    // Build final query
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;

    // Add ordering
    if (query.trim()) {
      baseQuery += ` ORDER BY rank, entries.created_at DESC`;
    } else {
      baseQuery += ` ORDER BY entries.created_at DESC`;
    }

    baseQuery += ` LIMIT ?`;
    params.push(limit);

    try {
      const rows = await db.getAllAsync<EntryRow>(baseQuery, params);

      const entries: JournalEntry[] = [];
      for (const row of rows) {
        const tags = await this.getTagsForEntry(row.id);
        entries.push(mapRowToEntry(row, tags));
      }

      return entries;
    } catch (error) {
      console.error('Search with filters failed:', error);
      return [];
    }
  }

  /**
   * Get entries for a specific date
   */
  async getEntriesByDate(date: Date): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const rows = await db.getAllAsync<EntryRow>(
      `SELECT * FROM entries
       WHERE deleted_at IS NULL
       AND created_at >= ? AND created_at <= ?
       ORDER BY created_at DESC`,
      [startOfDay.toISOString(), endOfDay.toISOString()]
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowToEntry(row, tags));
    }

    return entries;
  }

  /**
   * Get dates that have entries (for calendar highlighting)
   */
  async getDatesWithEntries(year: number, month: number): Promise<Set<number>> {
    const db = databaseService.getDatabase();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const rows = await db.getAllAsync<{ created_at: string }>(
      `SELECT created_at FROM entries
       WHERE deleted_at IS NULL
       AND created_at >= ? AND created_at <= ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const datesWithEntries = new Set<number>();
    for (const row of rows) {
      const date = new Date(row.created_at);
      datesWithEntries.add(date.getDate());
    }

    return datesWithEntries;
  }

  /**
   * Get mood distribution for a date range (for calendar mood display)
   */
  async getMoodsByDate(
    year: number,
    month: number
  ): Promise<Map<number, MoodType[]>> {
    const db = databaseService.getDatabase();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const rows = await db.getAllAsync<{ created_at: string; mood: string | null }>(
      `SELECT created_at, mood FROM entries
       WHERE deleted_at IS NULL
       AND mood IS NOT NULL
       AND created_at >= ? AND created_at <= ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const moodsByDate = new Map<number, MoodType[]>();
    for (const row of rows) {
      const date = new Date(row.created_at);
      const day = date.getDate();
      const existing = moodsByDate.get(day) || [];
      if (row.mood) {
        existing.push(row.mood as MoodType);
        moodsByDate.set(day, existing);
      }
    }

    return moodsByDate;
  }

  /**
   * Fallback search using LIKE when FTS fails
   */
  private async fallbackSearch(query: string, limit: number): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();
    const likeQuery = `%${query}%`;

    const rows = await db.getAllAsync<EntryRow>(
      `SELECT * FROM entries
       WHERE deleted_at IS NULL
       AND (title LIKE ? OR content LIKE ?)
       ORDER BY created_at DESC
       LIMIT ?`,
      [likeQuery, likeQuery, limit]
    );

    const entries: JournalEntry[] = [];
    for (const row of rows) {
      const tags = await this.getTagsForEntry(row.id);
      entries.push(mapRowToEntry(row, tags));
    }

    return entries;
  }

  /**
   * Fallback search with snippets using LIKE
   */
  private async fallbackSearchWithSnippets(
    query: string,
    limit: number
  ): Promise<SearchResult[]> {
    const entries = await this.fallbackSearch(query, limit);

    return entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      createdAt: entry.createdAt,
      snippet: this.generateSnippet(entry.content, query),
      tags: entry.tags,
      mood: entry.mood,
    }));
  }

  /**
   * Generate a snippet from content around the query match
   */
  private generateSnippet(content: string, query: string): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    }

    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + query.length + 30);

    let snippet = '';
    if (start > 0) snippet += '...';
    snippet += content.substring(start, end);
    if (end < content.length) snippet += '...';

    return snippet;
  }

  /**
   * Sanitize query for FTS5 to prevent syntax errors
   */
  private sanitizeFtsQuery(query: string): string {
    // Remove special FTS5 characters that could cause syntax errors
    // Keep alphanumeric, spaces, and common punctuation
    return query
      .replace(/['"(){}[\]^~*:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
}

export const searchService = SearchService.getInstance();
