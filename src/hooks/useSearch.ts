import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { searchService, SearchResult, SearchFilters } from '@/services/searchService';
import { JournalEntry, MoodType } from '@/types';

const MAX_RECENT_SEARCHES = 10;
const SEARCH_DEBOUNCE_MS = 300;

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  entries: JournalEntry[];
  isSearching: boolean;
  error: string | null;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  recentSearches: string[];
  addToRecentSearches: (query: string) => void;
  clearRecentSearches: () => void;
  hasActiveFilters: boolean;
  performSearch: () => Promise<void>;
}

// In-memory store for recent searches (could be persisted to AsyncStorage later)
let recentSearchesStore: string[] = [];

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = SEARCH_DEBOUNCE_MS, limit = 50 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>(recentSearchesStore);

  const debouncedQuery = useDebounce(query, debounceMs);

  const hasActiveFilters =
    (filters.tagIds && filters.tagIds.length > 0) ||
    !!filters.mood ||
    !!filters.startDate ||
    !!filters.endDate;

  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const addToRecentSearches = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Remove duplicate if exists
    const filtered = recentSearchesStore.filter(
      (s) => s.toLowerCase() !== trimmed.toLowerCase()
    );

    // Add to beginning and limit size
    recentSearchesStore = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches([...recentSearchesStore]);
  }, []);

  const clearRecentSearches = useCallback(() => {
    recentSearchesStore = [];
    setRecentSearches([]);
  }, []);

  const performSearch = useCallback(async () => {
    const searchQuery = query.trim();

    // If no query and no filters, clear results
    if (!searchQuery && !hasActiveFilters) {
      setResults([]);
      setEntries([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      if (hasActiveFilters) {
        // Use filtered search
        const searchEntries = await searchService.searchWithFilters(
          searchQuery,
          filters,
          limit
        );
        setEntries(searchEntries);

        // Convert entries to search results for display
        setResults(
          searchEntries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            createdAt: entry.createdAt,
            snippet: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
            tags: entry.tags,
            mood: entry.mood,
          }))
        );
      } else {
        // Use FTS search with snippets
        const searchResults = await searchService.searchWithSnippets(searchQuery, limit);
        setResults(searchResults);

        // Also get full entries for potential use
        const searchEntries = await searchService.search(searchQuery, limit);
        setEntries(searchEntries);
      }

      // Add to recent searches if query is meaningful
      if (searchQuery.length >= 2) {
        addToRecentSearches(searchQuery);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, hasActiveFilters, limit, addToRecentSearches]);

  // Auto-search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.trim() || hasActiveFilters) {
      performSearch();
    } else {
      setResults([]);
      setEntries([]);
    }
  }, [debouncedQuery, filters, hasActiveFilters]);

  return {
    query,
    setQuery,
    results,
    entries,
    isSearching,
    error,
    filters,
    setFilters,
    clearFilters,
    recentSearches,
    addToRecentSearches,
    clearRecentSearches,
    hasActiveFilters,
    performSearch,
  };
}

// Hook for getting entries by date (for calendar)
export function useEntriesByDate(date: Date | null) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setEntries([]);
      return;
    }

    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await searchService.getEntriesByDate(date);
        setEntries(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load entries';
        setError(message);
        console.error('Error loading entries by date:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [date?.toDateString()]);

  return { entries, isLoading, error };
}

// Hook for getting calendar data (dates with entries and moods)
export function useCalendarData(year: number, month: number) {
  const [datesWithEntries, setDatesWithEntries] = useState<Set<number>>(new Set());
  const [moodsByDate, setMoodsByDate] = useState<Map<number, MoodType[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);

      try {
        const [dates, moods] = await Promise.all([
          searchService.getDatesWithEntries(year, month),
          searchService.getMoodsByDate(year, month),
        ]);

        setDatesWithEntries(dates);
        setMoodsByDate(moods);
      } catch (err) {
        console.error('Error loading calendar data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [year, month]);

  return { datesWithEntries, moodsByDate, isLoading };
}
