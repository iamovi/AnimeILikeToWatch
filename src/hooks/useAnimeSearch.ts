import { useState, useCallback, useEffect } from 'react';
import { searchAnime, getTrendingAnime, AniListAnime, convertAniListToAppFormat } from '@/lib/anilist';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch trending on mount
  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      try {
        const { animes } = await getTrendingAnime(1, 30);
        setTrending(animes.map(convertAniListToAppFormat));
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // Search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { animes } = await searchAnime(debouncedQuery, 1, 30);
        setResults(animes.map(convertAniListToAppFormat));
        
        if (animes.length === 0) {
          setError('No anime found. Try a different search term.');
        }
      } catch (err) {
        setError('Failed to search. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    trending,
    isLoading,
    error,
    clearSearch,
    displayResults: query.trim() ? results : trending,
  };
}
