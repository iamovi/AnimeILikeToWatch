import { useState, useEffect, useCallback } from 'react';
import { Anime, AnimeStatus, AnimeListState } from '@/types/anime';

const STORAGE_KEY = 'animeILikeToWatch_list';

const getInitialState = (): AnimeListState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
          const imported = JSON.parse(e.target?.result as string) as AnimeListState;
          if (imported.animes && Array.isArray(imported.animes)) {
            setState({
              animes: imported.animes,
              lastUpdated: Date.now(),
            });
            resolve(true);
          } else {
            resolve(false);
          }
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
