export type AnimeStatus = 'watching' | 'completed' | 'plan-to-watch' | 'dropped' | 'on-hold';

export interface Anime {
  id: string;
  title: string;
  titleJapanese?: string;
  imageUrl: string;
  episodes?: number;
  currentEpisode?: number;
  description: string;
  genres: string[];
  status: AnimeStatus;
  rating?: number;
  year?: number;
  anilistId?: number;
  addedAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AnimeListState {
  animes: Anime[];
  lastUpdated: number;
}
