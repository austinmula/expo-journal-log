# Offline-First Journal Application Development Plan

## Overview

This document outlines the complete development plan for building an offline-first journal application using Expo and React Native. The application is designed to function entirely without an internet connection, ensuring users can always access and create journal entries regardless of connectivity status.

---

## Table of Contents

1. [Project Setup and Initialization](#1-project-setup-and-initialization)
2. [Offline-First Architecture](#2-offline-first-architecture)
3. [Local Data Storage Solution](#3-local-data-storage-solution)
4. [Core Features](#4-core-features)
5. [UI/UX Considerations](#5-uiux-considerations)
6. [Data Persistence and Sync Strategy](#6-data-persistence-and-sync-strategy)
7. [File Structure and Component Organization](#7-file-structure-and-component-organization)
8. [Implementation Phases](#8-implementation-phases)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Project Setup and Initialization

### 1.1 Prerequisites

- Node.js (LTS version 18+)
- npm or yarn package manager
- Expo CLI (`npx expo` - no global install needed)
- iOS Simulator (macOS) and/or Android Emulator
- VS Code with React Native extensions (recommended)

### 1.2 Project Initialization

```bash
# Create a new Expo project with TypeScript template
npx create-expo-app@latest journal-app --template blank-typescript

# Navigate to project directory
cd journal-app

# Install core dependencies
npx expo install expo-sqlite expo-file-system expo-secure-store
npx expo install expo-router expo-constants expo-status-bar
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-safe-area-context react-native-screens

# Install additional dependencies
npm install zustand @tanstack/react-query date-fns uuid
npm install -D @types/uuid
```

### 1.3 Initial Configuration

**app.json Configuration:**

```json
{
  "expo": {
    "name": "Journal",
    "slug": "journal-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "journal",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourname.journal"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "package": "com.yourname.journal"
    },
    "plugins": [
      "expo-router",
      "expo-sqlite"
    ]
  }
}
```

**TypeScript Configuration (tsconfig.json):**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

---

## 2. Offline-First Architecture

### 2.1 Core Principles

The offline-first architecture ensures that:

1. **All data is stored locally first** - The device is the source of truth
2. **No network dependency for core functionality** - Users can create, read, update, and delete entries without internet
3. **Graceful degradation** - If future sync features fail, the app continues to work
4. **Optimistic UI updates** - Changes appear immediately without waiting for network responses

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                  │
│  (React Native Components with Expo Router)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     State Management                             │
│  (Zustand Store - In-Memory Cache)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Access Layer                             │
│  (Repository Pattern - Abstracts Storage)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Local Storage Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   expo-sqlite   │  │  expo-secure-   │  │  expo-file-     │  │
│  │   (Journal      │  │  store          │  │  system         │  │
│  │    Entries)     │  │  (Settings)     │  │  (Attachments)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Future)
┌─────────────────────────────────────────────────────────────────┐
│                    Sync Layer (Optional)                         │
│  (Background Sync Queue - When Online)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Offline-First Data Flow

1. **Write Operations:**
   - User creates/edits entry
   - Data written to SQLite immediately
   - Zustand store updated for instant UI refresh
   - Entry marked with `syncStatus: 'pending'` (for future sync)
   - UI shows success immediately (optimistic update)

2. **Read Operations:**
   - App loads data from SQLite on startup
   - Zustand store hydrated with local data
   - All reads come from local store (zero network latency)
   - Search and filter operations run against local database

3. **Delete Operations:**
   - Soft delete with `deletedAt` timestamp
   - Allows recovery and proper sync handling
   - Hard delete after configurable retention period

---

## 3. Local Data Storage Solution

### 3.1 Technology Choice: expo-sqlite

**Why expo-sqlite?**

- **Performance:** Native SQLite is significantly faster than AsyncStorage for structured data
- **Query Capability:** Full SQL support enables complex queries, search, and filtering
- **Reliability:** Battle-tested database engine with ACID compliance
- **Offline-Native:** Designed for local-first applications
- **Scalability:** Handles thousands of entries without performance degradation
- **Expo Support:** First-party Expo module with excellent integration

### 3.2 Database Schema

```sql
-- Journal Entries Table
CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_status TEXT DEFAULT 'pending',
    sync_version INTEGER DEFAULT 0
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Entry-Tags Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (entry_id, tag_id),
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Full-Text Search Virtual Table
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
    title,
    content,
    content='entries',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
    INSERT INTO entries_fts(rowid, title, content)
    VALUES (NEW.rowid, NEW.title, NEW.content);
END;

CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
    INSERT INTO entries_fts(entries_fts, rowid, title, content)
    VALUES('delete', OLD.rowid, OLD.title, OLD.content);
END;

CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
    INSERT INTO entries_fts(entries_fts, rowid, title, content)
    VALUES('delete', OLD.rowid, OLD.title, OLD.content);
    INSERT INTO entries_fts(rowid, title, content)
    VALUES (NEW.rowid, NEW.title, NEW.content);
END;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_sync_status ON entries(sync_status);
CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at);
```

### 3.3 Database Service Implementation

```typescript
// src/services/database.ts
import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('journal.db');
    await this.runMigrations();
  }

  async runMigrations(): Promise<void> {
    // Run schema creation and migrations
    // Migrations should be versioned and run incrementally
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }
}

export const databaseService = DatabaseService.getInstance();
```

### 3.4 Storage Strategy by Data Type

| Data Type | Storage Solution | Rationale |
|-----------|-----------------|-----------|
| Journal Entries | expo-sqlite | Structured data, needs querying |
| Tags/Categories | expo-sqlite | Relational data, foreign keys |
| User Settings | expo-secure-store | Small, sensitive data |
| App Preferences | expo-secure-store | Theme, notification settings |
| Image Attachments | expo-file-system | Binary data, file references in SQLite |
| Sync Queue | expo-sqlite | Needs ordering, retry logic |

---

## 4. Core Features

### 4.1 Creating Journal Entries

**Requirements:**
- Rich text input field for entry content
- Optional title field (auto-generated from first line if empty)
- Automatic timestamp capture (created_at, updated_at)
- Optional mood selector (emoji-based)
- Tag assignment capability
- Auto-save functionality (save draft every 30 seconds)
- Offline creation with immediate local persistence

**Implementation Details:**

```typescript
// src/types/entry.ts
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: MoodType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  tags: Tag[];
  syncStatus: 'pending' | 'synced' | 'conflict';
  syncVersion: number;
}

export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface Tag {
  id: string;
  name: string;
  color: string;
}
```

**Auto-Save Implementation:**

```typescript
// src/hooks/useAutoSave.ts
export function useAutoSave(
  content: string,
  onSave: (content: string) => Promise<void>,
  delay: number = 30000
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content.trim()) {
        await onSave(content);
        setLastSaved(new Date());
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [content, delay]);

  return { lastSaved };
}
```

### 4.2 Editing Journal Entries

**Requirements:**
- Load existing entry data instantly from local storage
- Track changes with updated_at timestamp
- Preserve original created_at
- Conflict detection for future sync scenarios
- Undo/redo capability within editing session
- Optimistic UI updates

**Version Tracking:**

```typescript
// Increment sync_version on each edit for conflict resolution
async function updateEntry(entry: Partial<JournalEntry>): Promise<void> {
  const db = databaseService.getDatabase();
  await db.runAsync(
    `UPDATE entries
     SET title = ?, content = ?, mood = ?,
         updated_at = ?, sync_status = 'pending',
         sync_version = sync_version + 1
     WHERE id = ?`,
    [entry.title, entry.content, entry.mood,
     new Date().toISOString(), entry.id]
  );
}
```

### 4.3 Deleting Journal Entries

**Requirements:**
- Soft delete (set deleted_at timestamp)
- Confirmation dialog before deletion
- "Recently Deleted" view for recovery
- Permanent deletion after 30 days
- Immediate UI update with undo option

**Implementation:**

```typescript
// Soft delete
async function softDeleteEntry(id: string): Promise<void> {
  const db = databaseService.getDatabase();
  await db.runAsync(
    `UPDATE entries
     SET deleted_at = ?, sync_status = 'pending'
     WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

// Restore from trash
async function restoreEntry(id: string): Promise<void> {
  const db = databaseService.getDatabase();
  await db.runAsync(
    `UPDATE entries
     SET deleted_at = NULL, sync_status = 'pending'
     WHERE id = ?`,
    [id]
  );
}

// Permanent delete (run periodically or manually)
async function purgeDeletedEntries(daysOld: number = 30): Promise<void> {
  const db = databaseService.getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  await db.runAsync(
    `DELETE FROM entries WHERE deleted_at < ?`,
    [cutoffDate.toISOString()]
  );
}
```

### 4.4 Date/Time Tracking

**Requirements:**
- Automatic capture of creation timestamp
- Display relative time ("2 hours ago", "Yesterday")
- Calendar view for date-based navigation
- Filter entries by date range
- Timezone-aware storage (store in UTC, display in local)

**Date Utilities:**

```typescript
// src/utils/dateUtils.ts
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatEntryDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export function formatEntryTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getEntriesByDateRange(
  entries: JournalEntry[],
  startDate: Date,
  endDate: Date
): JournalEntry[] {
  return entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= startDate && entryDate <= endDate;
  });
}
```

### 4.5 Search Functionality

**Requirements:**
- Full-text search across title and content
- Search highlighting in results
- Recent searches history
- Search suggestions based on tags and common words
- Instant results (< 100ms) thanks to local SQLite FTS

**FTS Implementation:**

```typescript
// src/services/searchService.ts
export async function searchEntries(query: string): Promise<JournalEntry[]> {
  const db = databaseService.getDatabase();

  // Use FTS5 for full-text search
  const results = await db.getAllAsync<EntryRow>(
    `SELECT entries.* FROM entries
     JOIN entries_fts ON entries.rowid = entries_fts.rowid
     WHERE entries_fts MATCH ?
     AND entries.deleted_at IS NULL
     ORDER BY rank`,
    [query]
  );

  return results.map(mapRowToEntry);
}

// Search with highlighting
export async function searchWithSnippets(
  query: string
): Promise<SearchResult[]> {
  const db = databaseService.getDatabase();

  const results = await db.getAllAsync<SearchResultRow>(
    `SELECT entries.id, entries.title, entries.created_at,
            snippet(entries_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
     FROM entries
     JOIN entries_fts ON entries.rowid = entries_fts.rowid
     WHERE entries_fts MATCH ?
     AND entries.deleted_at IS NULL
     ORDER BY rank
     LIMIT 50`,
    [query]
  );

  return results;
}
```

### 4.6 Categories and Tags

**Requirements:**
- Create custom tags with color coding
- Assign multiple tags to entries
- Filter entries by tag
- Tag suggestions while typing
- Tag management screen (rename, merge, delete)
- Preserve tag relationships offline

**Tag Service:**

```typescript
// src/services/tagService.ts
export class TagService {
  async createTag(name: string, color: string): Promise<Tag> {
    const db = databaseService.getDatabase();
    const id = uuid.v4();

    await db.runAsync(
      `INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
      [id, name.toLowerCase().trim(), color, new Date().toISOString()]
    );

    return { id, name, color };
  }

  async getTagsForEntry(entryId: string): Promise<Tag[]> {
    const db = databaseService.getDatabase();

    return db.getAllAsync<Tag>(
      `SELECT t.* FROM tags t
       JOIN entry_tags et ON t.id = et.tag_id
       WHERE et.entry_id = ?`,
      [entryId]
    );
  }

  async addTagToEntry(entryId: string, tagId: string): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync(
      `INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`,
      [entryId, tagId]
    );
  }

  async getEntriesByTag(tagId: string): Promise<JournalEntry[]> {
    const db = databaseService.getDatabase();

    const results = await db.getAllAsync<EntryRow>(
      `SELECT e.* FROM entries e
       JOIN entry_tags et ON e.id = et.entry_id
       WHERE et.tag_id = ? AND e.deleted_at IS NULL
       ORDER BY e.created_at DESC`,
      [tagId]
    );

    return results.map(mapRowToEntry);
  }
}
```

---

## 5. UI/UX Considerations

### 5.1 Design Principles

1. **Offline Transparency:** Never show loading states for local operations
2. **Instant Feedback:** All interactions should feel immediate
3. **Minimal Chrome:** Focus on content, reduce UI clutter
4. **Accessibility:** Support screen readers, dynamic type sizes
5. **Dark Mode Support:** Respect system preferences, allow override

### 5.2 Navigation Structure (Expo Router)

```
app/
├── _layout.tsx          # Root layout with providers
├── (tabs)/
│   ├── _layout.tsx      # Tab bar configuration
│   ├── index.tsx        # Home/Timeline view
│   ├── calendar.tsx     # Calendar view
│   ├── search.tsx       # Search screen
│   └── settings.tsx     # Settings screen
├── entry/
│   ├── [id].tsx         # View/Edit entry
│   └── new.tsx          # Create new entry
├── tags/
│   ├── index.tsx        # Tag management
│   └── [id].tsx         # Entries by tag
└── trash.tsx            # Recently deleted
```

### 5.3 Key Screens

**Home Screen (Timeline View):**
- Reverse chronological list of entries
- Entry preview cards showing title, snippet, date, mood, tags
- Floating action button for new entry
- Pull-to-refresh (refresh from local DB, not network)
- Infinite scroll with virtualized list

**Entry Editor:**
- Full-screen text editor
- Toolbar with formatting options (if rich text)
- Tag picker accessible from toolbar
- Mood selector
- Auto-save indicator
- Back gesture to save and exit

**Search Screen:**
- Search bar with instant results
- Filter chips for tags, date range, mood
- Recent searches
- Empty state with search tips

**Calendar View:**
- Monthly calendar with entry indicators
- Tap date to see entries for that day
- Swipe between months
- Visual mood tracking across days

### 5.4 Component Library

Build a consistent design system:

```typescript
// src/components/ui/
├── Button.tsx           # Primary, secondary, ghost variants
├── Card.tsx             # Entry card container
├── Input.tsx            # Text input with label
├── TextArea.tsx         # Multi-line input
├── IconButton.tsx       # Icon-only buttons
├── Badge.tsx            # Tag badges
├── Modal.tsx            # Bottom sheet modals
├── EmptyState.tsx       # Empty list states
└── LoadingState.tsx     # Skeleton loaders (minimal use)
```

### 5.5 Theming

```typescript
// src/constants/theme.ts
export const lightTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#6366F1',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' },
    h2: { fontSize: 22, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
  },
};

export const darkTheme = {
  colors: {
    background: '#1A1A2E',
    surface: '#16213E',
    primary: '#818CF8',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    error: '#F87171',
    success: '#34D399',
  },
  // ... same spacing and typography
};
```

### 5.6 Offline Status Indicator

While the app works fully offline, show sync status for future cloud sync:

```typescript
// src/components/SyncStatusIndicator.tsx
export function SyncStatusIndicator() {
  const { pendingCount, isOnline } = useSyncStatus();

  if (pendingCount === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isOnline
          ? `Syncing ${pendingCount} entries...`
          : `${pendingCount} entries waiting to sync`
        }
      </Text>
    </View>
  );
}
```

---

## 6. Data Persistence and Sync Strategy

### 6.1 Local Persistence (Current Implementation)

**Data Flow:**

```
User Action → Zustand Store → SQLite → UI Update
                    ↓
              Persist to disk
                    ↓
            Available offline
```

**Zustand Store with Persistence:**

```typescript
// src/stores/entryStore.ts
import { create } from 'zustand';
import { entryRepository } from '@/services/entryRepository';

interface EntryState {
  entries: JournalEntry[];
  isLoading: boolean;

  // Actions
  loadEntries: () => Promise<void>;
  createEntry: (entry: CreateEntryInput) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  isLoading: true,

  loadEntries: async () => {
    set({ isLoading: true });
    const entries = await entryRepository.getAll();
    set({ entries, isLoading: false });
  },

  createEntry: async (input) => {
    const entry = await entryRepository.create(input);
    set({ entries: [entry, ...get().entries] });
    return entry;
  },

  updateEntry: async (id, updates) => {
    await entryRepository.update(id, updates);
    set({
      entries: get().entries.map(e =>
        e.id === id ? { ...e, ...updates } : e
      ),
    });
  },

  deleteEntry: async (id) => {
    await entryRepository.softDelete(id);
    set({
      entries: get().entries.filter(e => e.id !== id),
    });
  },
}));
```

### 6.2 Future Cloud Sync Architecture

Design the local system to be sync-ready:

**Sync Queue Table:**

```sql
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,  -- 'entry', 'tag', 'entry_tag'
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,    -- 'create', 'update', 'delete'
    payload TEXT NOT NULL,      -- JSON of the change
    created_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TEXT,
    error TEXT
);
```

**Sync Strategy:**

1. **Change Tracking:** Every mutation adds an entry to sync_queue
2. **Background Sync:** When online, process queue in order
3. **Conflict Resolution:**
   - Last-write-wins for simple conflicts
   - Merge for concurrent edits (future enhancement)
   - User notification for unresolvable conflicts

**Sync Service (Future Implementation):**

```typescript
// src/services/syncService.ts
export class SyncService {
  private isProcessing = false;

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingItems = await this.getPendingItems();

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await this.markSynced(item.id);
        } catch (error) {
          await this.handleSyncError(item, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // POST to cloud API
    // Handle response
    // Update local sync_status
  }
}
```

### 6.3 Data Export/Import

Allow users to backup their data locally:

```typescript
// src/services/exportService.ts
export async function exportToJSON(): Promise<string> {
  const entries = await entryRepository.getAll();
  const tags = await tagRepository.getAll();

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    tags,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importFromJSON(json: string): Promise<ImportResult> {
  const data = JSON.parse(json);

  // Validate schema version
  // Import with conflict handling
  // Return summary of imported items
}
```

---

## 7. File Structure and Component Organization

### 7.1 Complete Project Structure

```
journal-app/
├── app/                           # Expo Router pages
│   ├── _layout.tsx               # Root layout (providers, fonts)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Home/Timeline
│   │   ├── calendar.tsx          # Calendar view
│   │   ├── search.tsx            # Search
│   │   └── settings.tsx          # Settings
│   ├── entry/
│   │   ├── [id].tsx              # View/Edit entry
│   │   └── new.tsx               # New entry
│   ├── tags/
│   │   ├── index.tsx             # Tag management
│   │   └── [id].tsx              # Entries by tag
│   └── trash.tsx                 # Recently deleted
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── index.ts          # Barrel export
│   │   │
│   │   ├── entries/              # Entry-specific components
│   │   │   ├── EntryCard.tsx
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryEditor.tsx
│   │   │   ├── MoodSelector.tsx
│   │   │   └── EntryPreview.tsx
│   │   │
│   │   ├── tags/                 # Tag-specific components
│   │   │   ├── TagBadge.tsx
│   │   │   ├── TagPicker.tsx
│   │   │   ├── TagList.tsx
│   │   │   └── TagEditor.tsx
│   │   │
│   │   ├── search/               # Search components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── RecentSearches.tsx
│   │   │
│   │   ├── calendar/             # Calendar components
│   │   │   ├── CalendarView.tsx
│   │   │   ├── DayCell.tsx
│   │   │   └── MonthHeader.tsx
│   │   │
│   │   └── layout/               # Layout components
│   │       ├── Header.tsx
│   │       ├── TabBar.tsx
│   │       └── SafeAreaWrapper.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useEntries.ts         # Entry data hook
│   │   ├── useTags.ts            # Tag data hook
│   │   ├── useSearch.ts          # Search functionality
│   │   ├── useAutoSave.ts        # Auto-save logic
│   │   ├── useTheme.ts           # Theme access
│   │   ├── useDebounce.ts        # Debounce utility
│   │   └── useNetworkStatus.ts   # Online/offline detection
│   │
│   ├── services/                 # Data and business logic
│   │   ├── database.ts           # SQLite initialization
│   │   ├── entryRepository.ts    # Entry CRUD operations
│   │   ├── tagRepository.ts      # Tag CRUD operations
│   │   ├── searchService.ts      # FTS search
│   │   ├── exportService.ts      # Import/export
│   │   └── syncService.ts        # Future sync logic
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── entryStore.ts         # Entry state
│   │   ├── tagStore.ts           # Tag state
│   │   ├── settingsStore.ts      # App settings
│   │   └── index.ts              # Store exports
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── entry.ts              # Entry types
│   │   ├── tag.ts                # Tag types
│   │   ├── database.ts           # DB row types
│   │   └── navigation.ts         # Navigation types
│   │
│   ├── utils/                    # Utility functions
│   │   ├── dateUtils.ts          # Date formatting
│   │   ├── stringUtils.ts        # String helpers
│   │   ├── colorUtils.ts         # Color manipulation
│   │   └── validation.ts         # Input validation
│   │
│   └── constants/                # App constants
│       ├── theme.ts              # Theme definitions
│       ├── moods.ts              # Mood options
│       ├── colors.ts             # Color palette
│       └── config.ts             # App configuration
│
├── assets/                       # Static assets
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── app.json                      # Expo configuration
├── babel.config.js               # Babel configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── README.md                     # Project documentation
```

### 7.2 Import Conventions

Use path aliases for clean imports:

```typescript
// Good - using aliases
import { Button, Card } from '@/components/ui';
import { useEntries } from '@/hooks/useEntries';
import { entryRepository } from '@/services/entryRepository';
import { JournalEntry } from '@/types/entry';

// Avoid - relative paths
import { Button } from '../../../components/ui/Button';
```

### 7.3 Component Guidelines

**Component Structure:**

```typescript
// src/components/entries/EntryCard.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TagBadge } from '@/components/tags/TagBadge';
import { formatEntryDate, getRelativeTime } from '@/utils/dateUtils';
import type { JournalEntry } from '@/types/entry';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => onPress(entry)}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {entry.title}
      </Text>
      <Text
        style={[styles.preview, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {entry.content}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {getRelativeTime(entry.createdAt)}
        </Text>
        <View style={styles.tags}>
          {entry.tags.slice(0, 3).map(tag => (
            <TagBadge key={tag.id} tag={tag} size="small" />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
});
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Project initialization with Expo
- [ ] Configure TypeScript and path aliases
- [ ] Set up SQLite database and schema
- [ ] Implement database service
- [ ] Create base UI component library
- [ ] Set up theming system
- [ ] Configure Expo Router navigation

### Phase 2: Core Features (Week 2-3)

- [ ] Entry repository (CRUD operations)
- [ ] Zustand store for entries
- [ ] Home screen with entry list
- [ ] Entry creation screen
- [ ] Entry viewing screen
- [ ] Entry editing with auto-save
- [ ] Soft delete and trash functionality

### Phase 3: Organization Features (Week 4)

- [ ] Tag system implementation
- [ ] Tag CRUD operations
- [ ] Tag picker component
- [ ] Filter entries by tag
- [ ] Tag management screen
- [ ] Mood tracking feature

### Phase 4: Search and Discovery (Week 5)

- [ ] FTS5 search implementation
- [ ] Search screen with filters
- [ ] Search result highlighting
- [ ] Recent searches
- [ ] Calendar view
- [ ] Date-based filtering

### Phase 5: Polish and Enhancement (Week 6)

- [ ] Dark mode support
- [ ] Settings screen
- [ ] Data export/import
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Error handling and edge cases

### Phase 6: Future Cloud Sync Preparation

- [ ] Sync queue implementation
- [ ] Network status detection
- [ ] Conflict resolution UI
- [ ] Cloud API integration (when backend ready)

---

## 9. Testing Strategy

### 9.1 Unit Tests

Test business logic in isolation:

```typescript
// __tests__/services/entryRepository.test.ts
describe('EntryRepository', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('creates an entry with correct timestamps', async () => {
    const entry = await entryRepository.create({
      title: 'Test Entry',
      content: 'Test content',
    });

    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.syncStatus).toBe('pending');
  });

  it('soft deletes an entry', async () => {
    const entry = await entryRepository.create({ ... });
    await entryRepository.softDelete(entry.id);

    const deleted = await entryRepository.getById(entry.id);
    expect(deleted?.deletedAt).toBeDefined();
  });
});
```

### 9.2 Integration Tests

Test database operations end-to-end:

```typescript
describe('Search Integration', () => {
  it('finds entries by full-text search', async () => {
    await entryRepository.create({
      title: 'Morning Thoughts',
      content: 'Had coffee and read the newspaper',
    });

    const results = await searchService.search('coffee');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Morning Thoughts');
  });
});
```

### 9.3 Component Tests

Test UI components with React Native Testing Library:

```typescript
describe('EntryCard', () => {
  it('displays entry title and preview', () => {
    const entry = mockEntry({ title: 'My Day', content: 'Long content...' });
    const { getByText } = render(<EntryCard entry={entry} onPress={jest.fn()} />);

    expect(getByText('My Day')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const entry = mockEntry();
    const { getByTestId } = render(<EntryCard entry={entry} onPress={onPress} />);

    fireEvent.press(getByTestId('entry-card'));
    expect(onPress).toHaveBeenCalledWith(entry);
  });
});
```

### 9.4 Offline Testing Checklist

- [ ] App launches without network connection
- [ ] Entries can be created offline
- [ ] Entries persist after app restart
- [ ] Search works offline
- [ ] All navigation works offline
- [ ] No network error messages appear during normal offline use

---

## Conclusion

This development plan provides a comprehensive roadmap for building an offline-first journal application using Expo and React Native. The key principles emphasized throughout are:

1. **Offline by Default:** Every feature works without internet connectivity
2. **Local-First Data:** SQLite provides robust, queryable local storage
3. **Instant UI:** No loading states for local operations
4. **Future-Ready:** Architecture supports eventual cloud sync without major refactoring
5. **Maintainable:** Clear separation of concerns and consistent patterns

By following this plan, you will create a journal application that provides an excellent user experience regardless of network conditions, with a solid foundation for future enhancements.
