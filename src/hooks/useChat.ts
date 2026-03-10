import { useState, useCallback } from 'react';
import { ChatMessage, Anime, AnimeStatus } from '@/types/anime';
import { sampleAnimes } from '@/data/sampleAnimes';

const GREETINGS = [
  "Hey there! 👋 I'm AniBuddy, your anime companion! What are we watching today?",
  "Yo! Welcome back, fellow weeb~ 🎌 Ready to dive into some anime?",
  "Konnichiwa! ✨ AniBuddy at your service! What anime adventure awaits?",
  "Hey hey! 🌸 Your friendly neighborhood anime buddy here! What's up?",
  "*stretches* Oh! You're here! 😄 Let's talk anime!",
];

const THINKING_PHRASES = [
  "Hmm, let me think...",
  "Ooh, good question!",
  "Ah, I see what you mean~",
  "Oh! That reminds me...",
];

const EXCITED_REACTIONS = ["🔥", "✨", "💫", "🎉", "⭐", "💖", "🌟"];
const randomReaction = () => EXCITED_REACTIONS[Math.floor(Math.random() * EXCITED_REACTIONS.length)];
const randomThinking = () => THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];

const getRandomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

// Personality responses for different moods
const enthusiasticPhrases = [
  "Oh man, you have GREAT taste!",
  "Yesss, I love this choice!",
  "A person of culture, I see~",
  "Now we're talking!",
  "Excellent pick, seriously!",
  "This is gonna be good! 🔥",
  "You won't regret this one!",
];

const empathyPhrases = [
  "I totally get that!",
  "Right? Same here honestly",
  "I feel you on that one",
  "Mood, honestly",
  "Been there!",
];

const casualFillers = [
  "haha",
  "lol",
  "honestly",
  "ngl",
  "tbh",
  "~",
];

const randomEnthusiastic = () => enthusiasticPhrases[Math.floor(Math.random() * enthusiasticPhrases.length)];
const randomEmpathy = () => empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
const randomFiller = () => casualFillers[Math.floor(Math.random() * casualFillers.length)];

interface UseChatProps {
  animes: Anime[];
  addAnime: (anime: Omit<Anime, 'id' | 'addedAt' | 'updatedAt'>) => Anime;
  updateStatus: (id: string, status: AnimeStatus) => void;
  getByStatus: (status: AnimeStatus) => Anime[];
  exportList: () => void;
}

export function useChat({ animes, addAnime, getByStatus, exportList }: UseChatProps) {
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

    // Casual greetings
    if (/^(hi|hello|hey|yo|sup|wassup|what'?s up)/i.test(lowerMessage)) {
      const greetings = [
        `Hey hey! ${randomReaction()} What's on your mind today?`,
        "Yo! Good to see you~ Wanna talk anime or check your list?",
        "Hiii! 👋 I was just thinking about what anime to recommend you lol",
        "*waves excitedly* What brings you here today?",
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // How are you / personal questions
    if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going") || lowerMessage.includes('how are u')) {
      const responses = [
        "I'm doing great! Just been binge-watching some classics~ 😄 How about you?",
        "Pretty good! Been thinking about which anime to recommend next haha. You?",
        "Living my best life helping fellow weebs! 🌸 What about you?",
        "Can't complain! Just vibing with some good anime energy~ You doing okay?",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Thanks responses
    if (/thank|thanks|thx|ty/i.test(lowerMessage)) {
      const thanks = [
        "Anytime! That's what I'm here for~ 😊",
        "No problem at all! Happy to help a fellow anime fan!",
        "You're welcome! 💫 Let me know if you need anything else!",
        "Of course! *happy anime noises* 🎌",
      ];
      return thanks[Math.floor(Math.random() * thanks.length)];
    }

    // Recommendation requests
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('similar') || lowerMessage.includes('what should i watch')) {
      const genres = ['action', 'romance', 'comedy', 'horror', 'slice of life', 'fantasy', 'sci-fi', 'psychological', 'sports', 'isekai'];
      const mentionedGenre = genres.find(g => lowerMessage.includes(g));
      
      let recommendations = sampleAnimes;
      if (mentionedGenre) {
        recommendations = sampleAnimes.filter(a => 
          a.genres.some(g => g.toLowerCase().includes(mentionedGenre))
        );
      }
      
      const picks = recommendations.sort(() => Math.random() - 0.5).slice(0, 3);
      
      if (picks.length === 0) {
        return `Hmm, I couldn't find exact matches for that... ${randomReaction()} BUT, you can't go wrong with Attack on Titan, Demon Slayer, or Jujutsu Kaisen - they're absolutely incredible! Want me to add any to your list?`;
      }

      const intro = mentionedGenre 
        ? `Ooh ${mentionedGenre} anime? ${randomEnthusiastic()} Here are some bangers:`
        : `${randomThinking()} Based on my totally professional anime expertise, you should check out:`;
      
      return `${intro}\n\n${picks.map(a => `• **${a.title}** - ${a.description.slice(0, 100)}...`).join('\n\n')}\n\n${randomReaction()} Want me to add any of these to your list? Just say the word!`;
    }

    // Add to list with context
    if (lowerMessage.includes('add') && (lowerMessage.includes('list') || lowerMessage.includes('watch'))) {
      const found = sampleAnimes.find(a => lowerMessage.includes(a.title.toLowerCase()));
      
      if (found) {
        const alreadyExists = animes.some(a => a.title.toLowerCase() === found.title.toLowerCase());
        if (alreadyExists) {
          return `Oh! ${found.title} is already chilling in your list! 😅 Want to update its status or something?`;
        }
        
        addAnime({
          title: found.title,
          titleJapanese: found.titleJapanese,
          imageUrl: found.imageUrl,
          episodes: found.episodes,
          description: found.description,
          genres: found.genres,
          status: 'plan-to-watch',
          year: found.year,
        });
        
        const reactions = [
          `Done! Added **${found.title}** to your Plan to Watch! ${randomReaction()} You're gonna love it, trust me~`,
          `Gotcha! **${found.title}** is now on your list! ${randomEnthusiastic()}`,
          `*adds with enthusiasm* **${found.title}** added! ${randomReaction()} Great choice honestly!`,
        ];
        return reactions[Math.floor(Math.random() * reactions.length)];
      }
      
      return "Which anime should I add? Just tell me the name and I'll hook you up! 📝";
    }

    // Show lists with personality
    if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('what') || lowerMessage.includes('my anime')) {
      if (lowerMessage.includes('watching') || lowerMessage.includes('current')) {
        const watching = getByStatus('watching');
        if (watching.length === 0) {
          return "You're not watching anything right now! 😱 That's a crime honestly... Want some recommendations to fix that?";
        }
        const intro = watching.length > 3 
          ? `Wow, you've got quite the lineup! ${randomReaction()} Here's what you're watching:`
          : "Here's your current watch list:";
        return `📺 **Currently Watching (${watching.length}):**\n\n${watching.map(a => `• ${a.title} ${a.currentEpisode ? `(Ep ${a.currentEpisode}/${a.episodes || '?'})` : ''}`).join('\n')}\n\n${intro.includes('Wow') ? "Living the dream~" : "Keep it up! 💪"}`;
      }
      
      if (lowerMessage.includes('completed') || lowerMessage.includes('finished') || lowerMessage.includes('done')) {
        const completed = getByStatus('completed');
        if (completed.length === 0) {
          return "No completed anime yet... but hey, everyone starts somewhere! 💪 The journey of a thousand anime begins with a single episode~";
        }
        const praise = completed.length > 10 
          ? "A true veteran! 🏆" 
          : completed.length > 5 
            ? "Nice progress! 🌟" 
            : "Great start! ✨";
        return `✅ **Completed (${completed.length}):** ${praise}\n\n${completed.map(a => `• ${a.title}`).join('\n')}\n\nWhich one was your favorite?`;
      }
      
      if (lowerMessage.includes('plan') || lowerMessage.includes('to watch') || lowerMessage.includes('queue')) {
        const plan = getByStatus('plan-to-watch');
        if (plan.length === 0) {
          return "Your Plan to Watch is empty! 😮 That's rare... Want me to recommend some must-watch anime?";
        }
        const comment = plan.length > 10 
          ? "Quite the backlog! 😅 I believe in you though~" 
          : "Good selection! 🎯";
        return `📝 **Plan to Watch (${plan.length}):** ${comment}\n\n${plan.map(a => `• ${a.title}`).join('\n')}\n\nReady to start any of these?`;
      }
      
      if (lowerMessage.includes('dropped')) {
        const dropped = getByStatus('dropped');
        if (dropped.length === 0) {
          return "No dropped anime! Either you have great taste or endless patience... probably both! 😄";
        }
        return `💔 **Dropped (${dropped.length}):**\n\n${dropped.map(a => `• ${a.title}`).join('\n')}\n\nSometimes anime just isn't for us, no shame in that!`;
      }
      
      // General stats with personality
      const stats = {
        watching: getByStatus('watching').length,
        completed: getByStatus('completed').length,
        plan: getByStatus('plan-to-watch').length,
        dropped: getByStatus('dropped').length,
        onHold: getByStatus('on-hold').length,
      };
      
      const total = animes.length;
      let statusComment = "";
      if (total === 0) {
        statusComment = "Time to start your anime journey! 🚀";
      } else if (total < 10) {
        statusComment = "Just getting started! The best is yet to come~ ✨";
      } else if (total < 50) {
        statusComment = "Nice collection! You're really getting into it! 🔥";
      } else {
        statusComment = "Wow, a true anime connoisseur! 👑";
      }
      
      return `📊 **Your Anime Stats:**\n\n• 📺 Watching: ${stats.watching}\n• ✅ Completed: ${stats.completed}\n• 📝 Plan to Watch: ${stats.plan}\n• ⏸️ On Hold: ${stats.onHold}\n• 💔 Dropped: ${stats.dropped}\n\n**Total: ${total} anime tracked!**\n\n${statusComment}`;
    }

    // Backup/Export with enthusiasm
    if (lowerMessage.includes('backup') || lowerMessage.includes('export') || lowerMessage.includes('save') || lowerMessage.includes('download')) {
      exportList();
      return `Gotcha! Downloading your backup now! 📁✨ Keep it somewhere safe - your precious anime list must be protected at all costs! You can restore it anytime from Settings.`;
    }

    // Restore/Import
    if (lowerMessage.includes('restore') || lowerMessage.includes('import') || lowerMessage.includes('upload') || lowerMessage.includes('load')) {
      return "To restore your list, hit the **⚙️ Settings** button up top and use **Import** to upload your backup file! Your list will be back in no time~ 📂✨";
    }

    // Help with personality
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you') || lowerMessage.includes('how do') || lowerMessage.includes('how to')) {
      return `Hey! I'm AniBuddy, your personal anime assistant! ${randomReaction()} Here's what we can do together:\n\n• 🎯 **Get Recommendations** - "recommend action anime" or "suggest something like Naruto"\n• ➕ **Manage Your List** - "add Demon Slayer to my list"\n• 📊 **Check Your Stats** - "show my watching list" or "what are my stats"\n• 💾 **Backup & Restore** - "backup my list" or "how to restore"\n\nJust chat naturally! I'm here to help~ 🌸`;
    }

    // Anime-specific small talk
    if (lowerMessage.includes('favorite') || lowerMessage.includes('best anime') || lowerMessage.includes('goat')) {
      return `${randomThinking()} That's tough! There are so many amazing ones... But classics like **Attack on Titan**, **Fullmetal Alchemist: Brotherhood**, and **Steins;Gate** are up there for sure! ${randomReaction()} What about you? What's YOUR top pick?`;
    }

    if (lowerMessage.includes('boring') || lowerMessage.includes('bored')) {
      const suggestions = sampleAnimes.sort(() => Math.random() - 0.5).slice(0, 2);
      return `Bored?! We can fix that! 😤 How about trying **${suggestions[0].title}** or **${suggestions[1].title}**? Both are absolute bangers! Want me to add them to your list?`;
    }

    // Easter eggs
    if (lowerMessage.includes('waifu') || lowerMessage.includes('husbando')) {
      return `Ah, a person of culture! 😏 I don't judge~ Everyone has their favorites! Though I'm just here to help with your anime list, haha!`;
    }

    if (lowerMessage.includes('manga')) {
      return `Manga is amazing too! 📚 Though I'm mainly an anime buddy... but hey, a lot of great manga get anime adaptations! Any favorites you're hoping get animated?`;
    }

    // Default responses with variety
    const defaults = [
      `${randomThinking()} I'm not quite sure what you mean, but I'm always down to chat about anime! Want some recommendations or wanna check your list?`,
      `Hmm, I didn't quite catch that~ 😅 But hey, we can talk about anime recs, your watchlist, or anything anime-related!`,
      `*tilts head* Not sure I follow... but I'm here to help with your anime journey! What would you like to do? ${randomReaction()}`,
      `${randomEmpathy()}, but I'm a bit confused haha. Try asking for recommendations or checking your anime stats!`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }, [animes, addAnime, getByStatus, exportList]);

  const sendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Variable typing delay for more natural feel
    const baseDelay = 600;
    const variableDelay = Math.random() * 800;
    const contentLengthDelay = Math.min(content.length * 10, 500);
    
    setTimeout(() => {
      const response = generateResponse(content);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, baseDelay + variableDelay + contentLengthDelay);
  }, [generateResponse]);

  return {
    messages,
    isTyping,
    sendMessage,
  };
}
