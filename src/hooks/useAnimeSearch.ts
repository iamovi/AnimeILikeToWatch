import { useState, useCallback, useEffect, useRef } from 'react';
import { searchAnime, getTrendingAnime, convertAniListToAppFormat } from '@/lib/anilist';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchResult {
  title: string;
  titleJapanese?: string;
  imageUrl: string;
  episodes?: number;
  description: string;
  genres: string[];
  year?: number;
  rating?: number;
  anilistId: number;
}

export function useAnimeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const searchRequestIdRef = useRef(0);

  // Fetch trending on mount
  useEffect(() => {
    let cancelled = false;

    const fetchTrending = async () => {
      setIsTrendingLoading(true);
      try {
        const { animes } = await getTrendingAnime(1, 30);
        if (!cancelled) {
          setTrending(animes.map(convertAniListToAppFormat));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch trending:', err);
        }
      } finally {
        if (!cancelled) {
          setIsTrendingLoading(false);
        }
      }
    };

    fetchTrending();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search when query changes
  useEffect(() => {
    let cancelled = false;
    const queryText = debouncedQuery.trim();

    const performSearch = async () => {
      if (!queryText) {
        // Invalidate previous in-flight searches.
        searchRequestIdRef.current += 1;
        setResults([]);
        setError(null);
        setIsSearchLoading(false);
        return;
      }

      const requestId = ++searchRequestIdRef.current;
      setIsSearchLoading(true);
      setError(null);

      try {
        const { animes } = await searchAnime(queryText, 1, 30);
        if (cancelled || requestId !== searchRequestIdRef.current) {
          return;
        }

        setResults(animes.map(convertAniListToAppFormat));

        if (animes.length === 0) {
          setError('No anime found. Try a different search term.');
        }
      } catch (err) {
        if (!cancelled && requestId === searchRequestIdRef.current) {
          setError('Failed to search. Please try again.');
          console.error('Search error:', err);
        }
      } finally {
        if (!cancelled && requestId === searchRequestIdRef.current) {
          setIsSearchLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsSearchLoading(false);
    searchRequestIdRef.current += 1;
  }, []);

  return {
    query,
    setQuery,
    results,
    trending,
    isLoading: isTrendingLoading || isSearchLoading,
    error,
    clearSearch,
    displayResults: query.trim() ? results : trending,
  };
}
