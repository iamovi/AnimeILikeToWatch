import { useState } from 'react';
import { useAnimeList } from '@/hooks/useAnimeList';
import { useChat } from '@/hooks/useChat';
import { AnimeList } from '@/components/AnimeList';
import { ChatPanel } from '@/components/ChatPanel';
import { AddAnimeDialog } from '@/components/AddAnimeDialog';
import { SettingsMenu } from '@/components/SettingsMenu';
import { AnimeDetailsSheet } from '@/components/AnimeDetailsSheet';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Tv } from 'lucide-react';
import { Anime } from '@/types/anime';

const Index = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    animes,
    addAnime,
    updateStatus,
    updateProgress,
    deleteAnime,
    getByStatus,
    exportList,
    importList,
  } = useAnimeList();

  const { messages, isTyping, sendMessage } = useChat({
    animes,
    addAnime,
    updateStatus,
    updateProgress,
    getByStatus,
    exportList,
  });

  const handleClearAll = () => {
    animes.forEach((anime) => deleteAnime(anime.id));
  };

  const handleAnimeClick = (anime: Anime) => {
    setSelectedAnime(anime);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-primary-foreground">あ</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg md:text-xl font-bold text-foreground truncate">
                  AnimeILikeToWatch
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Track your anime journey
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <AddAnimeDialog
                onAdd={addAnime}
                existingIds={animes.map((a) => a.title)}
              />
              <SettingsMenu
                onExport={exportList}
                onImport={importList}
                onClearAll={handleClearAll}
                animeCount={animes.length}
                animes={animes}
              />

              {/* Chat trigger */}
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 p-0">
                  <div className="h-full pt-12">
                    <ChatPanel
                      messages={messages}
                      isTyping={isTyping}
                      onSendMessage={sendMessage}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-4 lg:gap-6">
          {/* Anime List */}
          <div className="flex-1 min-w-0">
            {animes.length === 0 ? (
              <div className="text-center py-16 fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Tv className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome to AnimeILikeToWatch!
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start building your anime list. Add anime you're watching, completed,
                  or planning to watch. Ask AniBuddy for recommendations!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <AddAnimeDialog
                    onAdd={addAnime}
                    existingIds={animes.map((a) => a.title)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setChatOpen(true)}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Ask AniBuddy
                  </Button>
                </div>
              </div>
            ) : (
              <AnimeList
                animes={animes}
                onUpdateStatus={updateStatus}
                onUpdateProgress={updateProgress}
                onDelete={deleteAnime}
                onAnimeClick={handleAnimeClick}
              />
            )}
          </div>

        </div>
      </main>

      {/* Anime Details Sheet */}
      <AnimeDetailsSheet
        anime={selectedAnime}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdateStatus={updateStatus}
        onUpdateProgress={updateProgress}
      />

    </div>
  );
};

export default Index;
