import { useState, useEffect, useCallback } from 'react';
import { Anime, AnimeStatus, AnimeListState } from '@/types/anime';

const STORAGE_KEY = 'animeILikeToWatch_list';

const ANIME_STATUSES: AnimeStatus[] = ['watching', 'completed', 'plan-to-watch', 'dropped', 'on-hold'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAnimeStatus = (value: unknown): value is AnimeStatus =>
  typeof value === 'string' && ANIME_STATUSES.includes(value as AnimeStatus);

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const asPositiveInt = (value: unknown): number | undefined => {
  const parsed = asFiniteNumber(value);
  if (parsed === undefined) return undefined;
  const intValue = Math.trunc(parsed);
  return intValue > 0 ? intValue : undefined;
};

const asNonNegativeInt = (value: unknown): number | undefined => {
  const parsed = asFiniteNumber(value);
  if (parsed === undefined) return undefined;
  const intValue = Math.trunc(parsed);
  return intValue >= 0 ? intValue : undefined;
};

const asTimestamp = (value: unknown): number | undefined => {
  const parsed = asFiniteNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
};

const sanitizeGenres = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const genres = value
    .map((genre) => asNonEmptyString(genre))
    .filter((genre): genre is string => Boolean(genre));

  return [...new Set(genres)].slice(0, 10);
};

const sanitizeAnime = (value: unknown): Anime | null => {
  if (!isRecord(value)) return null;

  const title = asNonEmptyString(value.title);
  const imageUrl = asNonEmptyString(value.imageUrl);

  if (!title || !imageUrl) return null;

  const episodes = asPositiveInt(value.episodes);
  const currentEpisodeRaw = asNonNegativeInt(value.currentEpisode);
  const currentEpisode =
    currentEpisodeRaw !== undefined && episodes !== undefined
      ? Math.min(currentEpisodeRaw, episodes)
      : currentEpisodeRaw;

  const addedAt = asTimestamp(value.addedAt) ?? Date.now();
  const updatedAt = asTimestamp(value.updatedAt) ?? Date.now();

  return {
    id: asNonEmptyString(value.id) ?? crypto.randomUUID(),
    title,
    titleJapanese: asNonEmptyString(value.titleJapanese),
    imageUrl,
    episodes,
    currentEpisode,
    description: asNonEmptyString(value.description) ?? 'No description available.',
    genres: sanitizeGenres(value.genres),
    status: isAnimeStatus(value.status) ? value.status : 'plan-to-watch',
    rating: asFiniteNumber(value.rating),
    year: asPositiveInt(value.year),
    anilistId: asPositiveInt(value.anilistId),
    addedAt,
    updatedAt,
  };
};

const getInitialState = (): AnimeListState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (isRecord(parsed) && Array.isArray(parsed.animes)) {
        const sanitizedAnimes = parsed.animes
          .map(sanitizeAnime)
          .filter((anime): anime is Anime => anime !== null);

        return {
          animes: sanitizedAnimes,
          lastUpdated: Date.now(),
        };
      }
    }
  } catch (error) {
    console.error('Failed to load anime list from localStorage:', error);
  }
  return { animes: [], lastUpdated: Date.now() };
};

export function useAnimeList() {
  const [state, setState] = useState<AnimeListState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save anime list to localStorage:', error);
    }
  }, [state]);

  const addAnime = useCallback((anime: Omit<Anime, 'id' | 'addedAt' | 'updatedAt'>) => {
    const newAnime: Anime = {
      ...anime,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      animes: [...prev.animes, newAnime],
      lastUpdated: Date.now(),
    }));
    return newAnime;
  }, []);

  const updateAnime = useCallback((id: string, updates: Partial<Omit<Anime, 'id' | 'addedAt'>>) => {
    setState(prev => ({
      animes: prev.animes.map(anime =>
        anime.id === id
          ? { ...anime, ...updates, updatedAt: Date.now() }
          : anime
      ),
      lastUpdated: Date.now(),
    }));
  }, []);

  const deleteAnime = useCallback((id: string) => {
    setState(prev => ({
      animes: prev.animes.filter(anime => anime.id !== id),
      lastUpdated: Date.now(),
    }));
  }, []);

  const updateStatus = useCallback((id: string, status: AnimeStatus) => {
    updateAnime(id, { status });
  }, [updateAnime]);

  const updateProgress = useCallback((id: string, currentEpisode: number) => {
    updateAnime(id, { currentEpisode });
  }, [updateAnime]);

  const getByStatus = useCallback((status: AnimeStatus) => {
    return state.animes.filter(anime => anime.status === status);
  }, [state.animes]);

  const exportList = useCallback(() => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anime-list-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state]);

  const importList = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as unknown;

          const sourceAnimes = Array.isArray(parsed)
            ? parsed
            : isRecord(parsed) && Array.isArray(parsed.animes)
              ? parsed.animes
              : null;

          if (!sourceAnimes) {
            resolve(false);
            return;
          }

          const sanitized = sourceAnimes
            .map(sanitizeAnime)
            .filter((anime): anime is Anime => anime !== null);

          if (sourceAnimes.length > 0 && sanitized.length === 0) {
            resolve(false);
            return;
          }

          const usedIds = new Set<string>();
          const deduped = sanitized.map((anime) => {
            let nextId = anime.id;
            while (usedIds.has(nextId)) {
              nextId = crypto.randomUUID();
            }
            usedIds.add(nextId);
            return nextId === anime.id ? anime : { ...anime, id: nextId };
          });

          setState({
            animes: deduped,
            lastUpdated: Date.now(),
          });
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, []);

  return {
    animes: state.animes,
    lastUpdated: state.lastUpdated,
    addAnime,
    updateAnime,
    deleteAnime,
    updateStatus,
    updateProgress,
    getByStatus,
    exportList,
    importList,
  };
}
