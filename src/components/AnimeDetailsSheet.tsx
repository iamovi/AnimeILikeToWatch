import { useState, useEffect } from 'react';
import { Anime, AnimeStatus } from '@/types/anime';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from './StatusBadge';
import { 
  Play, Star, Calendar, Clock, Tv, Film, Users, 
  ExternalLink, Loader2, Plus, Minus,
  CheckCircle2, Timer
} from 'lucide-react';
import { getAnimeDetails, searchAnimeByTitle, AniListAnime, cleanDescription, formatTimeUntilAiring } from '@/lib/anilist';

interface AnimeDetailsSheetProps {
  anime: Anime | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: AnimeStatus) => void;
  onUpdateProgress: (id: string, episode: number) => void;
}

export function AnimeDetailsSheet({ 
  anime, 
  open, 
  onOpenChange, 
  onUpdateStatus,
  onUpdateProgress 
}: AnimeDetailsSheetProps) {
  const [details, setDetails] = useState<AniListAnime | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !anime) return;

    let cancelled = false;
    setLoading(true);
    setDetails(null);

    const fetchDetails = async () => {
      try {
        let result: AniListAnime | null = null;

        // Prefer stored AniList ID for precision and speed.
        if (anime.anilistId) {
          result = await getAnimeDetails(anime.anilistId);
        }

        // Fallback to title-based lookup if no ID exists or lookup fails.
        if (!result) {
          const searchResult = await searchAnimeByTitle(anime.title);
          if (searchResult) {
            result = await getAnimeDetails(searchResult.id);
          }
        }

        if (!cancelled) {
          setDetails(result);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching anime details:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [open, anime]);

  if (!anime) return null;

  const progress = anime.episodes 
    ? Math.round(((anime.currentEpisode || 0) / anime.episodes) * 100)
    : 0;

  const mainStudio = details?.studios?.nodes.find(s => s.isAnimationStudio)?.name 
    || details?.studios?.nodes[0]?.name;

  const trailerUrl = details?.trailer 
    ? details.trailer.site === 'youtube' 
      ? `https://www.youtube.com/watch?v=${details.trailer.id}`
      : null
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Banner/Cover Image */}
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <img
              src={details?.bannerImage || details?.coverImage?.extraLarge || anime.imageUrl}
              alt={anime.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = anime.imageUrl;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            {/* Floating cover image */}
            <div className="absolute bottom-0 left-4 translate-y-1/3 w-24 sm:w-32 aspect-[2/3] rounded-lg overflow-hidden shadow-xl border-4 border-background">
              <img
                src={details?.coverImage?.large || anime.imageUrl}
                alt={anime.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="pt-12 sm:pt-16 px-4 sm:px-6 pb-6">
            {/* Header */}
            <SheetHeader className="text-left mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg sm:text-xl font-bold leading-tight">
                    {anime.title}
                  </SheetTitle>
                  {anime.titleJapanese && (
                    <p className="text-sm text-muted-foreground mt-1">{anime.titleJapanese}</p>
                  )}
                </div>
                <StatusBadge status={anime.status} />
              </div>
            </SheetHeader>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              {details?.averageScore && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{(details.averageScore / 10).toFixed(1)}</span>
                </div>
              )}
              {(details?.seasonYear || anime.year) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{details?.season ? `${details.season} ` : ''}{details?.seasonYear || anime.year}</span>
                </div>
              )}
              {(details?.episodes || anime.episodes) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Tv className="w-4 h-4" />
                  <span>{details?.episodes || anime.episodes} episodes</span>
                </div>
              )}
              {details?.duration && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{details.duration} min</span>
                </div>
              )}
              {details?.format && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Film className="w-4 h-4" />
                  <span>{details.format}</span>
                </div>
              )}
            </div>

            {/* Next Episode Airing */}
            {details?.nextAiringEpisode && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">
                    Episode {details.nextAiringEpisode.episode} airing in {formatTimeUntilAiring(details.nextAiringEpisode.timeUntilAiring)}
                  </span>
                </div>
              </div>
            )}

            {/* Progress Bar (for watching status) */}
            {anime.status === 'watching' && anime.episodes && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Your Progress</span>
                  <span className="text-muted-foreground">
                    {anime.currentEpisode || 0} / {anime.episodes} ({progress}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-anime-watching transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateProgress(anime.id, Math.max(0, (anime.currentEpisode || 0) - 1))}
                    disabled={!anime.currentEpisode || anime.currentEpisode <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-20 text-center font-mono text-lg">
                    Ep {anime.currentEpisode || 0}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateProgress(anime.id, Math.min(anime.episodes!, (anime.currentEpisode || 0) + 1))}
                    disabled={anime.currentEpisode === anime.episodes}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(details?.genres || anime.genres).slice(0, 6).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Studio */}
            {mainStudio && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Users className="w-4 h-4" />
                <span>Studio: <span className="text-foreground font-medium">{mainStudio}</span></span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="episodes">Episodes</TabsTrigger>
                  <TabsTrigger value="related">Related</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4">
                  {/* Description */}
                  <div>
                    <h4 className="font-semibold mb-2">Synopsis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {details ? cleanDescription(details.description, 0) : anime.description}
                    </p>
                  </div>

                  {/* Trailer */}
                  {trailerUrl && (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={trailerUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4" />
                        Watch Trailer
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                  )}

                  {/* Characters */}
                  {details?.characters?.nodes && details.characters.nodes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Characters</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {details.characters.nodes.slice(0, 6).map((char) => (
                          <div key={char.id} className="text-center">
                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted mb-1">
                              <img
                                src={char.image.medium}
                                alt={char.name.full}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{char.name.full}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="episodes" className="space-y-3">
                  {details?.streamingEpisodes && details.streamingEpisodes.length > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        Available on {details.streamingEpisodes[0]?.site || 'streaming platforms'}
                      </p>
                      {details.streamingEpisodes.slice(0, 12).map((ep, index) => (
                        <a
                          key={index}
                          href={ep.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-20 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            {ep.thumbnail && (
                              <img
                                src={ep.thumbnail}
                                alt={ep.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ep.title}</p>
                            <p className="text-xs text-muted-foreground">{ep.site}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Tv className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {anime.episodes ? `${anime.episodes} episodes` : 'Episode count unknown'}
                      </p>
                      {anime.status === 'watching' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          You're on episode {anime.currentEpisode || 0}
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="related" className="space-y-4">
                  {/* Relations */}
                  {details?.relations?.edges && details.relations.edges.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Related Anime</h4>
                      <div className="space-y-2">
                        {details.relations.edges
                          .filter(e => e.node.type === 'ANIME')
                          .slice(0, 5)
                          .map((edge) => (
                            <div key={edge.node.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                              <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={edge.node.coverImage.medium}
                                  alt={edge.node.title.english || edge.node.title.romaji}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {edge.node.title.english || edge.node.title.romaji}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {edge.relationType.replace(/_/g, ' ').toLowerCase()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {details?.recommendations?.nodes && details.recommendations.nodes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">You Might Also Like</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {details.recommendations.nodes
                          .filter(n => n.mediaRecommendation)
                          .slice(0, 6)
                          .map((rec) => (
                            <div key={rec.mediaRecommendation!.id} className="text-center">
                              <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-1">
                                <img
                                  src={rec.mediaRecommendation!.coverImage.medium}
                                  alt={rec.mediaRecommendation!.title.english || rec.mediaRecommendation!.title.romaji}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {rec.mediaRecommendation!.title.english || rec.mediaRecommendation!.title.romaji}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {(!details?.relations?.edges?.length && !details?.recommendations?.nodes?.length) && (
                    <div className="text-center py-8">
                      <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No related anime found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Quick Status Change */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Quick Status</p>
              <div className="flex flex-wrap gap-2">
                {(['watching', 'completed', 'plan-to-watch', 'on-hold', 'dropped'] as AnimeStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={anime.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdateStatus(anime.id, status)}
                    className="text-xs"
                  >
                    {status === 'watching' && <Play className="w-3 h-3 mr-1" />}
                    {status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
