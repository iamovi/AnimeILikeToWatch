import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Anime, AnimeStatus } from '@/types/anime';
import { Plus, Search, X, Loader2, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAnimeSearch, SearchResult } from '@/hooks/useAnimeSearch';

interface AddAnimeDialogProps {
  onAdd: (anime: Omit<Anime, 'id' | 'addedAt' | 'updatedAt'>) => void;
  existingIds: string[];
}

export function AddAnimeDialog({ onAdd, existingIds }: AddAnimeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AnimeStatus>('plan-to-watch');
  
  const { 
    query, 
    setQuery, 
    displayResults, 
    isLoading, 
    error, 
    clearSearch 
  } = useAnimeSearch();

  const handleAdd = (anime: SearchResult) => {
    onAdd({
      title: anime.title,
      titleJapanese: anime.titleJapanese,
      imageUrl: anime.imageUrl,
      episodes: anime.episodes,
      description: anime.description,
      genres: anime.genres,
      status: selectedStatus,
      year: anime.year,
      rating: anime.rating,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      clearSearch();
    }
  };

  const statusOptions: { status: AnimeStatus; label: string }[] = [
    { status: 'watching', label: 'Watching' },
    { status: 'completed', label: 'Completed' },
    { status: 'plan-to-watch', label: 'Plan to Watch' },
    { status: 'on-hold', label: 'On Hold' },
    { status: 'dropped', label: 'Dropped' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-4">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Add</span>
          <span className="hidden sm:inline">Anime</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col mx-2">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Add Anime to List</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Search anime from AniList database
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {statusOptions.map(({ status, label }) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-full border transition-colors ${
                selectedStatus === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-foreground/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!query && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending anime</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 min-h-0 -mx-2 px-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && displayResults.map((anime) => {
            const isAdded = existingIds.includes(anime.title);
            return (
              <div
                key={anime.anilistId}
                className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">{anime.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {anime.titleJapanese}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>{anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}</span>
                    {anime.year && <span>• {anime.year}</span>}
                    {anime.rating && <span>• ⭐ {anime.rating.toFixed(1)}</span>}
                  </div>
                </div>
                {isAdded ? (
                  <span className="text-[10px] sm:text-xs text-muted-foreground px-2 sm:px-3 py-1 bg-muted rounded flex-shrink-0">
                    Added
                  </span>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handleAdd(anime)} 
                    className="text-xs px-2 sm:px-3 h-7 sm:h-8 flex-shrink-0"
                  >
                    Add
                  </Button>
                )}
              </div>
            );
          })}

          {!isLoading && error && (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <p className="text-sm sm:text-base">{error}</p>
              <p className="text-xs sm:text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {!isLoading && !error && displayResults.length === 0 && !query && (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <p className="text-sm sm:text-base">Loading trending anime...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
