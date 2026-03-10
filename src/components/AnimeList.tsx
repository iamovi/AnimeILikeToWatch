import { Anime, AnimeStatus } from '@/types/anime';
import { AnimeCard } from './AnimeCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Check, Clock, Pause, X, LayoutGrid } from 'lucide-react';

interface AnimeListProps {
  animes: Anime[];
  onUpdateStatus: (id: string, status: AnimeStatus) => void;
  onUpdateProgress: (id: string, episode: number) => void;
  onDelete: (id: string) => void;
  onAnimeClick: (anime: Anime) => void;
}

const tabs: { value: AnimeStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'watching', label: 'Watching', icon: <Play className="w-4 h-4" /> },
  { value: 'completed', label: 'Completed', icon: <Check className="w-4 h-4" /> },
  { value: 'plan-to-watch', label: 'Planned', icon: <Clock className="w-4 h-4" /> },
  { value: 'on-hold', label: 'On Hold', icon: <Pause className="w-4 h-4" /> },
  { value: 'dropped', label: 'Dropped', icon: <X className="w-4 h-4" /> },
];

export function AnimeList({ animes, onUpdateStatus, onUpdateProgress, onDelete, onAnimeClick }: AnimeListProps) {
  const filterAnimes = (status: AnimeStatus | 'all') => {
    if (status === 'all') return animes;
    return animes.filter(anime => anime.status === status);
  };

  const getCounts = () => {
    return {
      all: animes.length,
      watching: animes.filter(a => a.status === 'watching').length,
      completed: animes.filter(a => a.status === 'completed').length,
      'plan-to-watch': animes.filter(a => a.status === 'plan-to-watch').length,
      'on-hold': animes.filter(a => a.status === 'on-hold').length,
      dropped: animes.filter(a => a.status === 'dropped').length,
    };
  };

  const counts = getCounts();

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max sm:w-full flex h-auto p-1 bg-muted/50 mb-4 gap-1">
          {tabs.map(({ value, label, icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap data-[state=active]:bg-background"
            >
              {icon}
              <span className="hidden xs:inline">{label}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs">{counts[value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map(({ value }) => (
        <TabsContent key={value} value={value} className="mt-0">
          {filterAnimes(value).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No anime in this list yet</p>
              <p className="text-sm mt-1">Ask AniBuddy for recommendations!</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {filterAnimes(value).map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateProgress={onUpdateProgress}
                  onDelete={onDelete}
                  onClick={() => onAnimeClick(anime)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
