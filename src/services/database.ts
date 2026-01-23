import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'journal.db';

// Default categories to seed on first run
const DEFAULT_CATEGORIES = [
  { id: 'default-personal', name: 'Personal', icon: 'journal-outline', color: '#6366F1', sortOrder: 0 },
  { id: 'default-work', name: 'Work', icon: 'briefcase-outline', color: '#F59E0B', sortOrder: 1 },
  { id: 'default-book', name: 'Book Notes', icon: 'book-outline', color: '#10B981', sortOrder: 2 },
  { id: 'default-travel', name: 'Travel', icon: 'airplane-outline', color: '#EC4899', sortOrder: 3 },
  { id: 'default-gratitude', name: 'Gratitude', icon: 'heart-outline', color: '#EF4444', sortOrder: 4 },
];

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;
  private isInitialized = false;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await this.runMigrations();
    this.isInitialized = true;
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Enable foreign keys
    await this.db.execAsync('PRAGMA foreign_keys = ON;');

    // Create categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT,
        color TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    // Seed default categories if table is empty
    await this.seedDefaultCategories();

    // Create entries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT,
        category_id TEXT REFERENCES categories(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        sync_version INTEGER DEFAULT 0
      );
    `);

    // Add category_id column to entries if it doesn't exist (migration for existing databases)
    await this.addCategoryIdColumnIfNeeded();

    // Create tags table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Create entry_tags junction table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS entry_tags (
        entry_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (entry_id, tag_id),
        FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);

    // Create FTS5 virtual table for full-text search
    await this.db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        title,
        content,
        content='entries',
        content_rowid='rowid'
      );
    `);

    // Create triggers to keep FTS in sync
    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(rowid, title, content)
        SELECT rowid, NEW.title, NEW.content FROM entries WHERE id = NEW.id;
      END;
    `);

    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, title, content)
        SELECT 'delete', rowid, OLD.title, OLD.content FROM entries WHERE id = OLD.id;
      END;
    `);

    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, title, content)
        SELECT 'delete', rowid, OLD.title, OLD.content FROM entries WHERE id = OLD.id;
        INSERT INTO entries_fts(rowid, title, content)
        SELECT rowid, NEW.title, NEW.content FROM entries WHERE id = NEW.id;
      END;
    `);

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_sync_status ON entries(sync_status);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at);
    `);

    // Create index for category filtering
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category_id);
    `);
  }

  private async seedDefaultCategories(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check if categories already exist
    const existingCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );

    if (existingCount && existingCount.count > 0) {
      return; // Categories already seeded
    }

    const now = new Date().toISOString();

    for (const category of DEFAULT_CATEGORIES) {
      await this.db.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, icon, color, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [category.id, category.name, category.icon, category.color, category.sortOrder, now]
      );
    }
  }

  private async addCategoryIdColumnIfNeeded(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check if category_id column exists
    const tableInfo = await this.db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(entries)"
    );

    const hasCategoryId = tableInfo.some(col => col.name === 'category_id');

    if (!hasCategoryId) {
      await this.db.execAsync(
        'ALTER TABLE entries ADD COLUMN category_id TEXT REFERENCES categories(id)'
      );
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
