import { useState, useCallback } from 'react';
import { ChatMessage, Anime, AnimeStatus } from '@/types/anime';
import { sampleAnimes } from '@/data/sampleAnimes';

const GREETINGS = [
  "Hey there! 👋 I'm AniBuddy, your anime companion! What are we watching today?",
  'Yo! Welcome back, fellow weeb~ 🎌 Ready to dive into some anime?',
  "Konnichiwa! ✨ AniBuddy at your service! What anime adventure awaits?",
  "Hey hey! 🌸 Your friendly neighborhood anime buddy here! What's up?",
  "*stretches* Oh! You're here! 😄 Let's talk anime!",
];

const THINKING_PHRASES = [
  'Hmm, let me think...',
  'Ooh, good question!',
  'Ah, I see what you mean~',
  'Oh! That reminds me...',
];

const EXCITED_REACTIONS = ['🔥', '✨', '💫', '🎉', '⭐', '💖', '🌟'];

const ENTHUSIASTIC_PHRASES = [
  'Oh man, you have GREAT taste!',
  'Yesss, I love this choice!',
  'A person of culture, I see~',
  "Now we're talking!",
  'Excellent pick, seriously!',
  "This is gonna be good! 🔥",
  "You won't regret this one!",
];

const EMPATHY_PHRASES = [
  'I totally get that!',
  'Right? Same here honestly',
  'I feel you on that one',
  'Mood, honestly',
  'Been there!',
];

const STATUS_ALIASES: Record<AnimeStatus, string[]> = {
  watching: ['watching', 'watch', 'current'],
  completed: ['completed', 'complete', 'finished', 'done'],
  'plan-to-watch': ['plan to watch', 'plan', 'planned', 'queue', 'later', 'watchlist'],
  'on-hold': ['on hold', 'hold', 'paused', 'pause'],
  dropped: ['dropped', 'drop', 'quit', 'stopped'],
};

const STATUS_LABELS: Record<AnimeStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  'plan-to-watch': 'Plan to Watch',
  'on-hold': 'On Hold',
  dropped: 'Dropped',
};

const GENRE_KEYWORDS = [
  'action',
  'romance',
  'comedy',
  'horror',
  'slice of life',
  'fantasy',
  'sci-fi',
  'psychological',
  'sports',
  'isekai',
  'thriller',
  'mystery',
  'drama',
  'adventure',
  'music',
  'school',
  'supernatural',
];

const getRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const pickMany = <T,>(items: T[], count: number): T[] => {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeTitle = (value: string): string => normalizeText(value);

const shortDescription = (text: string, maxLength = 110): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const getRandomGreeting = () => getRandom(GREETINGS);
const randomReaction = () => getRandom(EXCITED_REACTIONS);
const randomThinking = () => getRandom(THINKING_PHRASES);
const randomEnthusiastic = () => getRandom(ENTHUSIASTIC_PHRASES);
const randomEmpathy = () => getRandom(EMPATHY_PHRASES);

const detectGenre = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  return GENRE_KEYWORDS.find((genre) => lowerMessage.includes(genre)) || null;
};

const detectStatus = (message: string): AnimeStatus | null => {
  const normalized = normalizeText(message);
  const statuses = Object.entries(STATUS_ALIASES) as Array<[AnimeStatus, string[]]>;

  for (const [status, aliases] of statuses) {
    if (aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      return status;
    }
  }

  return null;
};

const titleMentioned = (message: string, title: string): boolean => {
  const normalizedMessage = normalizeText(message);
  const normalizedTitle = normalizeTitle(title);

  if (!normalizedMessage || !normalizedTitle) return false;
  if (normalizedMessage.includes(normalizedTitle)) return true;

  const titleTokens = normalizedTitle.split(' ').filter((token) => token.length > 2);
  if (titleTokens.length < 2) return false;

  return titleTokens.every((token) => normalizedMessage.includes(token));
};

const findAnimeByMessage = <T extends { title: string }>(message: string, list: T[]): T | null => {
  const byLongestTitle = [...list].sort((a, b) => b.title.length - a.title.length);
  return byLongestTitle.find((anime) => titleMentioned(message, anime.title)) || null;
};

const topGenres = (animes: Anime[]): string[] => {
  const counts = new Map<string, number>();

  for (const anime of animes) {
    for (const genre of anime.genres) {
      const key = genre.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
};

const extractEpisodeNumber = (message: string): number | null => {
  const match = message.match(/(?:episode|ep)\s*#?\s*(\d{1,4})/i) || message.match(/\b(\d{1,4})\s*episodes?\b/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

interface UseChatProps {
  animes: Anime[];
  addAnime: (anime: Omit<Anime, 'id' | 'addedAt' | 'updatedAt'>) => Anime;
  updateStatus: (id: string, status: AnimeStatus) => void;
  updateProgress: (id: string, episode: number) => void;
  getByStatus: (status: AnimeStatus) => Anime[];
  exportList: () => void;
}

export function useChat({ animes, addAnime, updateStatus, updateProgress, getByStatus, exportList }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: getRandomGreeting(),
      timestamp: Date.now(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const generateResponse = useCallback((userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const normalizedMessage = normalizeText(userMessage);

    const trackedAnime = findAnimeByMessage(userMessage, animes);
    const catalogAnime = findAnimeByMessage(userMessage, sampleAnimes);
    const requestedStatus = detectStatus(userMessage);

    if (!normalizedMessage) {
      return 'Say anything anime-related and I got you. Recommendations, stats, list updates, all of it ✨';
    }

    if (/^(hi|hello|hey|yo|sup|wassup|what\s?up)\b/i.test(lowerMessage)) {
      const greetings = [
        `Hey hey! ${randomReaction()} What's on your mind today?`,
        'Yo! Good to see you~ Wanna talk anime or check your list?',
        'Hiii! 👋 I was just thinking about what anime to recommend you lol',
        '*waves excitedly* What brings you here today?',
      ];
      return getRandom(greetings);
    }

    if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going") || lowerMessage.includes('how are u')) {
      const responses = [
        "I'm doing great! Just been binge-watching some classics~ 😄 How about you?",
        'Pretty good! Been thinking about which anime to recommend next haha. You?',
        'Living my best life helping fellow weebs! 🌸 What about you?',
        "Can't complain! Just vibing with some good anime energy~ You doing okay?",
      ];
      return getRandom(responses);
    }

    if (/\b(thank|thanks|thx|ty)\b/i.test(lowerMessage)) {
      const thanks = [
        "Anytime! That's what I'm here for~ 😊",
        'No problem at all! Happy to help a fellow anime fan!',
        "You're welcome! 💫 Let me know if you need anything else!",
        'Of course! *happy anime noises* 🎌',
      ];
      return getRandom(thanks);
    }

    if (/\b(backup|export|save|download)\b/i.test(lowerMessage)) {
      exportList();
      return 'Gotcha! Downloading your backup now! 📁✨ Keep it safe and you can restore it anytime from Settings.';
    }

    if (/\b(restore|import|upload|load)\b/i.test(lowerMessage)) {
      return 'To restore your list, open **⚙️ Settings** and choose **Import Backup**. I can walk you through it if needed.';
    }

    if (/\b(help|what can you|how do|how to|commands)\b/i.test(lowerMessage)) {
      return `I can be way more dynamic now ${randomReaction()} Try things like:

• **"recommend me action anime"**
• **"add frieren to my plan"**
• **"mark vinland saga completed"**
• **"episode 8 of one piece"**
• **"show my watching list"**
• **"show stats"**

Just type naturally, I’ll figure out your intent.`;
    }

    if (/\b(trending|new this season|latest)\b/i.test(lowerMessage)) {
      const trending = [...sampleAnimes]
        .sort((a, b) => (b.year || 0) - (a.year || 0) || (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      return `Fresh picks from newer seasons ${randomReaction()}:

${trending
        .map((anime) => `• **${anime.title}** (${anime.year || 'Unknown'}) - ⭐ ${anime.rating?.toFixed(1) || 'N/A'}`)
        .join('\n')}

Want me to add one to your list?`;
    }

    if ((/\b(episode|ep)\b/i.test(lowerMessage) || /\bi\s*(am|'m)\s*on\b/i.test(lowerMessage)) && animes.length > 0) {
      const episodeNumber = extractEpisodeNumber(userMessage);

      if (!trackedAnime) {
        if (episodeNumber !== null) {
          return `I caught episode **${episodeNumber}**, but I need the anime name too. Example: **"episode ${episodeNumber} of Naruto"**.`;
        }
        return 'Tell me the anime + episode number and I can update progress. Example: **"ep 12 of Jujutsu Kaisen"**.';
      }

      if (episodeNumber === null) {
        return `I found **${trackedAnime.title}** in your list. Tell me which episode number and I’ll update it.`;
      }

      const clampedEpisode = trackedAnime.episodes
        ? Math.min(Math.max(episodeNumber, 0), trackedAnime.episodes)
        : Math.max(episodeNumber, 0);

      updateProgress(trackedAnime.id, clampedEpisode);
      if (trackedAnime.status !== 'watching') {
        updateStatus(trackedAnime.id, 'watching');
      }

      const completionLine =
        trackedAnime.episodes && clampedEpisode >= trackedAnime.episodes
          ? `You reached the end of **${trackedAnime.title}** 🎉 Want me to mark it as completed too?`
          : `Progress saved: **${trackedAnime.title}** is now at episode **${clampedEpisode}${trackedAnime.episodes ? `/${trackedAnime.episodes}` : ''}**.`;

      return `${randomEnthusiastic()} ${completionLine}`;
    }

    const explicitStatusIntent = /\b(mark|set|move|change|update)\b/i.test(lowerMessage);
    if ((explicitStatusIntent || requestedStatus) && requestedStatus && trackedAnime) {
      updateStatus(trackedAnime.id, requestedStatus);

      return `Done ${randomReaction()} **${trackedAnime.title}** is now **${STATUS_LABELS[requestedStatus]}**.`;
    }

    if ((explicitStatusIntent || requestedStatus) && requestedStatus && !trackedAnime && animes.length > 0) {
      return `I can update that. Tell me the anime title too, like **"mark Naruto completed"**.`;
    }

    const addIntent = /\b(add|track|queue|put)\b/i.test(lowerMessage);
    if (addIntent) {
      const animeToAdd = catalogAnime;
      const targetStatus = requestedStatus || 'plan-to-watch';

      if (!animeToAdd) {
        return `I couldn't match that title in my built-in catalog yet. Try another title or use the **Add Anime** search for full AniList results.`;
      }

      const alreadyTracked = animes.find(
        (anime) => normalizeTitle(anime.title) === normalizeTitle(animeToAdd.title),
      );

      if (alreadyTracked) {
        if (requestedStatus && alreadyTracked.status !== requestedStatus) {
          updateStatus(alreadyTracked.id, requestedStatus);
          return `Already in your list, so I updated **${animeToAdd.title}** to **${STATUS_LABELS[requestedStatus]}** instead ${randomReaction()}`;
        }

        return `**${animeToAdd.title}** is already on your list. Want me to move it to another status?`;
      }

      addAnime({
        title: animeToAdd.title,
        titleJapanese: animeToAdd.titleJapanese,
        imageUrl: animeToAdd.imageUrl,
        episodes: animeToAdd.episodes,
        description: animeToAdd.description,
        genres: animeToAdd.genres,
        status: targetStatus,
        year: animeToAdd.year,
        rating: animeToAdd.rating,
      });

      return `${randomEnthusiastic()} Added **${animeToAdd.title}** to **${STATUS_LABELS[targetStatus]}**.`;
    }

    const recommendationIntent =
      /\b(recommend|suggest|similar|what should i watch|anything like|need.*watch)\b/i.test(lowerMessage) ||
      /\b(bored|boring)\b/i.test(lowerMessage);

    if (recommendationIntent) {
      const excludedTitles = new Set(animes.map((anime) => normalizeTitle(anime.title)));
      const requestedGenre = detectGenre(lowerMessage);

      let pool = sampleAnimes.filter((anime) => !excludedTitles.has(normalizeTitle(anime.title)));

      if (requestedGenre) {
        pool = pool.filter((anime) => anime.genres.some((genre) => genre.toLowerCase().includes(requestedGenre)));
      }

      if (!requestedGenre && catalogAnime) {
        const relatedGenres = catalogAnime.genres.map((genre) => genre.toLowerCase());
        const relatedPool = pool.filter((anime) =>
          anime.genres.some((genre) => relatedGenres.includes(genre.toLowerCase())),
        );
        if (relatedPool.length >= 3) {
          pool = relatedPool;
        }
      }

      if (!requestedGenre && !catalogAnime && animes.length > 0) {
        const preferred = topGenres(animes.filter((anime) => anime.status === 'watching' || anime.status === 'completed'));
        if (preferred.length > 0) {
          const preferredPool = pool.filter((anime) =>
            anime.genres.some((genre) => preferred.includes(genre.toLowerCase())),
          );
          if (preferredPool.length >= 3) {
            pool = preferredPool;
          }
        }
      }

      if (pool.length === 0) {
        pool = sampleAnimes;
      }

      const picks = pickMany(pool, 3);

      const intro = requestedGenre
        ? `Ooh ${requestedGenre} picks? ${randomEnthusiastic()} Here are 3 good ones:`
        : catalogAnime
          ? `If you like **${catalogAnime.title}**, you'll probably vibe with these:`
          : `${randomThinking()} Based on your vibe, try these next:`;

      return `${intro}

${picks
        .map(
          (anime) =>
            `• **${anime.title}** (${anime.genres.slice(0, 2).join(', ')}) - ${shortDescription(anime.description)}`,
        )
        .join('\n\n')}

Want me to add one directly to your list?`;
    }

    const asksForStats = /\b(stats|statistics|summary|overview|progress)\b/i.test(lowerMessage);
    const asksForList = /\b(show|list|my anime|what am i|what's in my)\b/i.test(lowerMessage);

    if (asksForStats || asksForList) {
      if (/\b(watching|current)\b/i.test(lowerMessage)) {
        const watching = getByStatus('watching');
        if (watching.length === 0) {
          return `You're not watching anything right now 😱 Want me to recommend something quick to start?`;
        }

        return `📺 **Currently Watching (${watching.length})**\n\n${watching
          .map((anime) => `• ${anime.title}${anime.currentEpisode ? ` (ep ${anime.currentEpisode}/${anime.episodes || '?'})` : ''}`)
          .join('\n')}`;
      }

      if (/\b(completed|finished|done)\b/i.test(lowerMessage)) {
        const completed = getByStatus('completed');
        if (completed.length === 0) {
          return 'No completed anime yet, but we can fix that soon 💪';
        }

        return `✅ **Completed (${completed.length})**\n\n${completed.map((anime) => `• ${anime.title}`).join('\n')}`;
      }

      if (/\b(plan|queue|to watch|watchlist)\b/i.test(lowerMessage)) {
        const plan = getByStatus('plan-to-watch');
        if (plan.length === 0) {
          return 'Your plan-to-watch is empty. Want 3 recs right now?';
        }

        return `📝 **Plan to Watch (${plan.length})**\n\n${plan.map((anime) => `• ${anime.title}`).join('\n')}`;
      }

      if (/\b(dropped|drop)\b/i.test(lowerMessage)) {
        const dropped = getByStatus('dropped');
        if (dropped.length === 0) {
          return `No dropped anime. Respect ${randomReaction()}`;
        }

        return `💔 **Dropped (${dropped.length})**\n\n${dropped.map((anime) => `• ${anime.title}`).join('\n')}`;
      }

      if (/\b(on hold|hold|paused|pause)\b/i.test(lowerMessage)) {
        const onHold = getByStatus('on-hold');
        if (onHold.length === 0) {
          return 'Nothing is on hold right now.';
        }

        return `⏸️ **On Hold (${onHold.length})**\n\n${onHold.map((anime) => `• ${anime.title}`).join('\n')}`;
      }

      const stats = {
        watching: getByStatus('watching').length,
        completed: getByStatus('completed').length,
        plan: getByStatus('plan-to-watch').length,
        dropped: getByStatus('dropped').length,
        onHold: getByStatus('on-hold').length,
      };

      const total = animes.length;
      const completionRate = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

      return `📊 **Your Anime Stats**

• 📺 Watching: ${stats.watching}
• ✅ Completed: ${stats.completed}
• 📝 Plan to Watch: ${stats.plan}
• ⏸️ On Hold: ${stats.onHold}
• 💔 Dropped: ${stats.dropped}

**Total tracked:** ${total}
**Completion rate:** ${completionRate}%

${
        total === 0
          ? 'Time to start your anime journey 🚀'
          : total < 10
            ? 'Nice start. Your list is building fast ✨'
            : total < 50
              ? `Looking strong ${randomReaction()} You're deep in the anime zone.`
              : 'Elite catalog status unlocked 👑'
      }`;
    }

    if (/\b(favorite|best anime|goat)\b/i.test(lowerMessage)) {
      if (animes.length > 0) {
        const completed = getByStatus('completed');
        if (completed.length > 0) {
          const topRated = [...completed]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

          return `Your list says these are top-tier for you ${randomReaction()}:

${topRated
            .map((anime) => `• **${anime.title}**${anime.rating ? ` (⭐ ${anime.rating.toFixed(1)})` : ''}`)
            .join('\n')}

Wanna find similar shows?`;
        }
      }

      return `${randomThinking()} All-time classics for me: **Attack on Titan**, **FMAB**, **Steins;Gate**. What's your #1?`;
    }

    if (/\b(waifu|husbando)\b/i.test(lowerMessage)) {
      return "Ah, a person of culture 😏 I don't judge. I'm just here to keep your anime list legendary.";
    }

    if (lowerMessage.includes('manga')) {
      return 'Manga is peak too 📚 If you want, I can suggest anime adaptations based on manga vibes.';
    }

    const listHint = animes.length > 0 ? `You can say things like **"mark ${animes[0].title} completed"**.` : 'Try **"recommend me 3 anime"** or **"add frieren to my list"**.';

    const defaults = [
      `${randomThinking()} I didn't fully catch that, but I'm ready to help with recs, list updates, stats, or progress tracking.`,
      `Hmm, not 100% sure what you meant ${randomEmpathy()} Want recommendations or list management?`,
      `I can work with natural chat now. ${listHint}`,
      `Try a direct command and I'll handle it instantly. ${listHint}`,
    ];

    return getRandom(defaults);
  }, [animes, addAnime, updateStatus, updateProgress, getByStatus, exportList]);

  const sendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const baseDelay = 450;
    const variableDelay = Math.random() * 700;
    const contentLengthDelay = Math.min(content.length * 8, 450);

    setTimeout(() => {
      const response = generateResponse(content);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, baseDelay + variableDelay + contentLengthDelay);
  }, [generateResponse]);

  return {
    messages,
    isTyping,
    sendMessage,
  };
}
