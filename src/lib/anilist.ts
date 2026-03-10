const ANILIST_API = 'https://graphql.anilist.co';

export interface AniListAnime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
    extraLarge?: string;
  };
  bannerImage?: string | null;
  episodes: number | null;
  description: string | null;
  genres: string[];
  seasonYear: number | null;
  averageScore: number | null;
  status: string;
  season?: string | null;
  format?: string | null;
  duration?: number | null;
  studios?: {
    nodes: { name: string; isAnimationStudio: boolean }[];
  };
  trailer?: {
    id: string;
    site: string;
  } | null;
  characters?: {
    nodes: {
      id: number;
      name: { full: string };
      image: { medium: string };
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { medium: string };
      } | null;
    }[];
  };
  relations?: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { medium: string };
        type: string;
      };
    }[];
  };
  streamingEpisodes?: {
    title: string;
    thumbnail: string;
    url: string;
    site: string;
  }[];
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
    timeUntilAiring: number;
  } | null;
}

interface AniListResponse {
  data: {
    Page?: {
      media: AniListAnime[];
      pageInfo: {
        total: number;
        hasNextPage: boolean;
      };
    };
    Media?: AniListAnime;
  };
}

const SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      hasNextPage
    }
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      episodes
      description(asHtml: false)
      genres
      seasonYear
      averageScore
      status
    }
  }
}
`;

const TRENDING_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      hasNextPage
    }
    media(type: ANIME, sort: TRENDING_DESC, status_in: [RELEASING, FINISHED]) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      episodes
      description(asHtml: false)
      genres
      seasonYear
      averageScore
      status
    }
  }
}
`;

const POPULAR_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      hasNextPage
    }
    media(type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      episodes
      description(asHtml: false)
      genres
      seasonYear
      averageScore
      status
    }
  }
}
`;

const ANIME_DETAILS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
      large
      medium
    }
    bannerImage
    episodes
    description(asHtml: false)
    genres
    seasonYear
    season
    format
    duration
    averageScore
    status
    studios {
      nodes {
        name
        isAnimationStudio
      }
    }
    trailer {
      id
      site
    }
    characters(perPage: 6, sort: ROLE) {
      nodes {
        id
        name {
          full
        }
        image {
          medium
        }
      }
    }
    recommendations(perPage: 6, sort: RATING_DESC) {
      nodes {
        mediaRecommendation {
          id
          title {
            romaji
            english
          }
          coverImage {
            medium
          }
        }
      }
    }
    relations {
      edges {
        relationType
        node {
          id
          title {
            romaji
            english
          }
          coverImage {
            medium
          }
          type
        }
      }
    }
    streamingEpisodes {
      title
      thumbnail
      url
      site
    }
    nextAiringEpisode {
      airingAt
      episode
      timeUntilAiring
    }
  }
}
`;

async function fetchFromAniList(query: string, variables: Record<string, unknown>): Promise<AniListResponse> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  return response.json();
}

export async function searchAnime(search: string, page = 1, perPage = 20): Promise<{
  animes: AniListAnime[];
  hasNextPage: boolean;
  total: number;
}> {
  try {
    const result = await fetchFromAniList(SEARCH_QUERY, { search, page, perPage });
    return {
      animes: result.data.Page?.media || [],
      hasNextPage: result.data.Page?.pageInfo.hasNextPage || false,
      total: result.data.Page?.pageInfo.total || 0,
    };
  } catch (error) {
    console.error('Error searching anime:', error);
    return { animes: [], hasNextPage: false, total: 0 };
  }
}

export async function getTrendingAnime(page = 1, perPage = 20): Promise<{
  animes: AniListAnime[];
  hasNextPage: boolean;
}> {
  try {
    const result = await fetchFromAniList(TRENDING_QUERY, { page, perPage });
    return {
      animes: result.data.Page?.media || [],
      hasNextPage: result.data.Page?.pageInfo.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return { animes: [], hasNextPage: false };
  }
}

export async function getPopularAnime(page = 1, perPage = 20): Promise<{
  animes: AniListAnime[];
  hasNextPage: boolean;
}> {
  try {
    const result = await fetchFromAniList(POPULAR_QUERY, { page, perPage });
    return {
      animes: result.data.Page?.media || [],
      hasNextPage: result.data.Page?.pageInfo.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    return { animes: [], hasNextPage: false };
  }
}

export async function getAnimeDetails(id: number): Promise<AniListAnime | null> {
  try {
    const result = await fetchFromAniList(ANIME_DETAILS_QUERY, { id });
    return result.data.Media || null;
  } catch (error) {
    console.error('Error fetching anime details:', error);
    return null;
  }
}

// Search by title to get AniList ID
export async function searchAnimeByTitle(title: string): Promise<AniListAnime | null> {
  try {
    const result = await searchAnime(title, 1, 1);
    return result.animes[0] || null;
  } catch (error) {
    console.error('Error searching anime by title:', error);
    return null;
  }
}

// Helper to clean HTML from descriptions
export function cleanDescription(html: string | null, maxLength = 300): string {
  if (!html) return 'No description available.';
  const cleaned = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  if (maxLength === 0) return cleaned;
  return cleaned.slice(0, maxLength) + (cleaned.length > maxLength ? '...' : '');
}

// Format status for display
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    FINISHED: 'Finished',
    RELEASING: 'Airing',
    NOT_YET_RELEASED: 'Not Yet Released',
    CANCELLED: 'Cancelled',
    HIATUS: 'On Hiatus',
  };
  return statusMap[status] || status;
}

// Format time until airing
export function formatTimeUntilAiring(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Convert AniList anime to our app format
export function convertAniListToAppFormat(anime: AniListAnime) {
  return {
    title: anime.title.english || anime.title.romaji,
    titleJapanese: anime.title.native || anime.title.romaji,
    imageUrl: anime.coverImage.large || anime.coverImage.medium,
    episodes: anime.episodes || undefined,
    description: cleanDescription(anime.description),
    genres: anime.genres.slice(0, 5),
    year: anime.seasonYear || undefined,
    rating: anime.averageScore ? anime.averageScore / 10 : undefined,
    anilistId: anime.id,
  };
}
