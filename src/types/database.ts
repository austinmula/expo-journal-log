// Database row types that match the SQLite schema
export interface EntryRow {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  sync_version: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface EntryWithCategoryRow extends EntryRow {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  category_sort_order: number | null;
  category_created_at: string | null;
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
