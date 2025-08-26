import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getPlaylistRecommendations = action({
  args: {
    playlistId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    try {
      // In a real implementation, you would use the Spotify Web API
      // For now, we'll simulate getting playlist data and use AI to recommend books
      
      // Simulated playlist analysis - in reality, you'd fetch from Spotify API
      const playlistAnalysis = await analyzePlaylistWithAI(args.playlistId);
      
      // Get books from our database that match the musical mood
      const books = await ctx.runQuery(api.books.searchBooks, { limit: 50 });
      
      // Use AI to match books to the musical mood
      const prompt = `Based on this music playlist analysis: "${playlistAnalysis}", recommend 5-8 books that would match the mood, energy, and themes of this music. Consider the emotional tone, genre characteristics, and overall vibe.

Available books:
${books.map(book => `- ${book.title} by ${book.author}: ${book.description.substring(0, 100)}... (Genres: ${book.genre.join(', ')}, Moods: ${book.mood.join(', ')})`).join('\n')}

Provide a brief explanation of how the music connects to these book recommendations, then list the recommended books.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content || "";
      
      // Extract book titles from AI response and match them to our database
      const recommendedBooks = [];
      for (const book of books) {
        if (aiResponse.toLowerCase().includes(book.title.toLowerCase()) && recommendedBooks.length < 6) {
          recommendedBooks.push(book);
        }
      }

      // If we don't have enough matches, add some popular books
      if (recommendedBooks.length < 3) {
        const popularBooks = books.filter(b => (b.averageRating || 0) >= 4.0).slice(0, 6);
        recommendedBooks.push(...popularBooks.filter(b => !recommendedBooks.find(rb => rb._id === b._id)));
      }

      return {
        explanation: aiResponse,
        books: recommendedBooks.slice(0, 6),
        playlistId: args.playlistId,
      };
    } catch (error) {
      console.error("Spotify recommendation error:", error);
      
      // Fallback to popular books
      const fallbackBooks = await ctx.runQuery(api.books.getFeaturedBooks, {});
      
      return {
        explanation: "We couldn't analyze your Spotify playlist right now, but here are some popular books you might enjoy! To get personalized music-based recommendations, make sure your playlist is public and try again.",
        books: fallbackBooks.slice(0, 6),
        playlistId: args.playlistId,
      };
    }
  },
});

async function analyzePlaylistWithAI(playlistId: string): Promise<string> {
  // In a real implementation, you would:
  // 1. Use Spotify Web API to get playlist tracks
  // 2. Analyze the audio features (energy, valence, danceability, etc.)
  // 3. Look at genres, artists, and track characteristics
  
  // For now, we'll simulate this with some common playlist patterns
  const playlistPatterns = [
    "upbeat pop and electronic music with high energy and positive vibes",
    "mellow indie and alternative rock with introspective and contemplative themes",
    "classical and ambient music suggesting sophistication and calm reflection",
    "hip-hop and R&B with themes of ambition, relationships, and urban life",
    "folk and acoustic music with storytelling and emotional depth",
    "rock and metal with intense energy and rebellious themes",
    "jazz and blues suggesting sophistication and emotional complexity",
    "world music and diverse genres indicating curiosity and cultural exploration"
  ];
  
  // Simulate analysis based on playlist ID characteristics
  const hash = playlistId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return playlistPatterns[Math.abs(hash) % playlistPatterns.length];
}
