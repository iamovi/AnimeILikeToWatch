import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, Tv, Clock, Trophy, TrendingUp, Play, Calendar, Star } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { Anime, AnimeStatus } from '@/types/anime';

interface StatsDialogProps {
  animes: Anime[];
  trigger?: React.ReactNode;
}

const STATUS_CONFIG: Record<AnimeStatus, { color: string; label: string }> = {
  'watching': { color: 'hsl(210, 100%, 50%)', label: 'Watching' },
  'completed': { color: 'hsl(142, 76%, 36%)', label: 'Completed' },
  'plan-to-watch': { color: 'hsl(45, 93%, 47%)', label: 'Plan to Watch' },
  'dropped': { color: 'hsl(0, 72%, 51%)', label: 'Dropped' },
  'on-hold': { color: 'hsl(262, 83%, 58%)', label: 'On Hold' },
};

export function StatsDialog({ animes, trigger }: StatsDialogProps) {
  const stats = useMemo(() => {
    const statusCounts = animes.reduce((acc, anime) => {
      acc[anime.status] = (acc[anime.status] || 0) + 1;
      return acc;
    }, {} as Record<AnimeStatus, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: STATUS_CONFIG[status as AnimeStatus].label,
      value: count,
      color: STATUS_CONFIG[status as AnimeStatus].color,
    }));

    const genreCounts = animes.reduce((acc, anime) => {
      anime.genres.forEach(genre => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const maxGenreCount = Math.max(...Object.values(genreCounts), 1);
    const genreData = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ 
        name: name.length > 10 ? name.slice(0, 10) + '…' : name,
        fullName: name,
        count,
        percentage: Math.round((count / maxGenreCount) * 100),
      }));

    const totalEpisodes = animes.reduce((sum, a) => sum + (a.episodes || 0), 0);
    const watchedEpisodes = animes.reduce((sum, a) => {
      if (a.status === 'completed' && a.episodes) return sum + a.episodes;
      return sum + (a.currentEpisode || 0);
    }, 0);

    const watchTimeMinutes = watchedEpisodes * 24;
    const watchTimeHours = Math.floor(watchTimeMinutes / 60);
    const watchTimeDays = (watchTimeMinutes / 60 / 24).toFixed(1);

    const ratedAnimes = animes.filter(a => a.rating);
    const avgRating = ratedAnimes.length > 0
      ? (ratedAnimes.reduce((sum, a) => sum + (a.rating || 0), 0) / ratedAnimes.length).toFixed(1)
      : null;

    const yearCounts = animes.reduce((acc, anime) => {
      if (anime.year) {
        const decade = Math.floor(anime.year / 10) * 10;
        const label = `${decade}s`;
        acc[label] = (acc[label] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const yearData = Object.entries(yearCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    const completionRate = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
    const completionData = [{ name: 'Progress', value: completionRate, fill: 'hsl(var(--primary))' }];

    return {
      total: animes.length,
      completed: statusCounts['completed'] || 0,
      watching: statusCounts['watching'] || 0,
      planToWatch: statusCounts['plan-to-watch'] || 0,
      statusData,
      genreData,
      yearData,
      totalEpisodes,
      watchedEpisodes,
      watchTimeHours,
      watchTimeDays,
      avgRating,
      completionRate,
      completionData,
    };
  }, [animes]);

  if (animes.length === 0) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Stats
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              Statistics
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Tv className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Add some anime to see your stats!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Stats
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground">
                <BarChart3 className="w-5 h-5" />
              </div>
              Your Anime Journey
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroStatCard
              icon={Tv}
              value={stats.total}
              label="Total Anime"
              sublabel="in your list"
            />
            <HeroStatCard
              icon={Trophy}
              value={stats.completed}
              label="Completed"
              sublabel="finished series"
              highlight
            />
            <HeroStatCard
              icon={Clock}
              value={stats.watchTimeHours}
              label="Hours"
              sublabel={`≈ ${stats.watchTimeDays} days`}
            />
            <HeroStatCard
              icon={Play}
              value={stats.watchedEpisodes.toLocaleString()}
              label="Episodes"
              sublabel="watched"
            />
          </div>

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <ChartCard title="Status Distribution" subtitle="Your anime by watch status">
              <div className="flex items-center gap-4">
                <div className="w-40 h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {stats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {stats.statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm flex-1">{item.name}</span>
                      <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* Completion Rate */}
            <ChartCard title="Completion Progress" subtitle="Episodes watched vs total">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={12}
                      data={stats.completionData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={6}
                        background={{ fill: 'hsl(var(--muted))' }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{stats.completionRate}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Episodes Watched</p>
                    <p className="text-2xl font-bold">{stats.watchedEpisodes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Episodes</p>
                    <p className="text-lg font-semibold text-muted-foreground">{stats.totalEpisodes.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Genre Distribution */}
          {stats.genreData.length > 0 && (
            <ChartCard title="Top Genres" subtitle="Your most watched categories" fullWidth>
              <div className="space-y-3">
                {stats.genreData.map((genre, index) => (
                  <div key={genre.fullName} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-4">{index + 1}</span>
                        <span className="text-sm font-medium">{genre.fullName}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{genre.count}</span>
                    </div>
                    <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Timeline Section */}
          {stats.yearData.length > 0 && (
            <ChartCard title="Anime by Era" subtitle="When your anime were released" fullWidth>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.yearData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].payload.name}</p>
                              <p className="text-xs text-muted-foreground">{payload[0].value} anime</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Summary Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
            <MiniStat icon={Play} label="Watching" value={stats.watching} />
            <MiniStat icon={Calendar} label="Planned" value={stats.planToWatch} />
            <MiniStat icon={Clock} label="Days Watched" value={stats.watchTimeDays} />
            {stats.avgRating && <MiniStat icon={Star} label="Avg Rating" value={`★ ${stats.avgRating}`} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HeroStatCard({ 
  icon: Icon, 
  value, 
  label, 
  sublabel,
  highlight = false 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl p-4 transition-all duration-200
      ${highlight 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-muted/50 hover:bg-muted/80'
      }
    `}>
      <Icon className={`w-8 h-8 mb-3 ${highlight ? 'opacity-90' : 'text-muted-foreground'}`} />
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className={`text-sm font-medium ${highlight ? 'opacity-90' : ''}`}>{label}</p>
      <p className={`text-xs ${highlight ? 'opacity-70' : 'text-muted-foreground'}`}>{sublabel}</p>
    </div>
  );
}

function ChartCard({ 
  title, 
  subtitle, 
  children,
  fullWidth = false 
}: { 
  title: string; 
  subtitle: string; 
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`bg-muted/30 rounded-xl p-5 ${fullWidth ? 'lg:col-span-2' : ''}`}>
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}