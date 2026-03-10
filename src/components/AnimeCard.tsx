import { Anime, AnimeStatus } from '@/types/anime';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Play, Check, Clock, Pause, X, Trash2, Plus, Minus } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  onUpdateStatus: (id: string, status: AnimeStatus) => void;
  onUpdateProgress: (id: string, episode: number) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

const statusOptions: { status: AnimeStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'watching', label: 'Watching', icon: <Play className="w-4 h-4" /> },
  { status: 'completed', label: 'Completed', icon: <Check className="w-4 h-4" /> },
  { status: 'plan-to-watch', label: 'Plan to Watch', icon: <Clock className="w-4 h-4" /> },
  { status: 'on-hold', label: 'On Hold', icon: <Pause className="w-4 h-4" /> },
  { status: 'dropped', label: 'Dropped', icon: <X className="w-4 h-4" /> },
];

export function AnimeCard({ anime, onUpdateStatus, onUpdateProgress, onDelete, onClick }: AnimeCardProps) {
  const progress = anime.episodes 
    ? Math.round(((anime.currentEpisode || 0) / anime.episodes) * 100)
    : 0;

  return (
    <div 
      className="anime-card group fade-in cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={onClick}
    >
      <div className="flex">
        {/* Image */}
        <div className="w-24 h-36 sm:w-28 sm:h-40 flex-shrink-0 overflow-hidden">
          <img
            src={anime.imageUrl}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {anime.title}
              </h3>
              {anime.titleJapanese && (
                <p className="text-xs text-muted-foreground truncate">
                  {anime.titleJapanese}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {statusOptions.map(({ status, label, icon }) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(anime.id, status);
                    }}
                    className={anime.status === status ? 'bg-muted' : ''}
                  >
                    {icon}
                    <span className="ml-2">{label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(anime.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="ml-2">Remove</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={anime.status} />
            {anime.year && (
              <span className="text-xs text-muted-foreground">{anime.year}</span>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 flex-1">
            {anime.description}
          </p>

          {/* Progress (for watching status) */}
          {anime.status === 'watching' && anime.episodes && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  Episode {anime.currentEpisode || 0} / {anime.episodes}
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-anime-watching transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProgress(anime.id, Math.max(0, (anime.currentEpisode || 0) - 1));
                  }}
                  disabled={!anime.currentEpisode || anime.currentEpisode <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProgress(anime.id, Math.min(anime.episodes!, (anime.currentEpisode || 0) + 1));
                  }}
                  disabled={anime.currentEpisode === anime.episodes}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Genres */}
          <div className="mt-2 flex flex-wrap gap-1">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
