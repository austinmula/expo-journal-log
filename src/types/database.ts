// Database row types that match the SQLite schema
export interface EntryRow {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  sync_version: number;
}

export interface TagRow {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface EntryTagRow {
  entry_id: string;
  tag_id: string;
}

export interface SearchResultRow {
  id: string;
  title: string;
  created_at: string;
  snippet: string;
}
