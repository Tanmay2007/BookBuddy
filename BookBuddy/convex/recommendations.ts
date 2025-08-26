import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getRecommendationsByMood = action({
  args: {
    mood: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { mood, limit = 5 } = args;
    
    // Get books that match the mood
    const books = await ctx.runQuery(api.books.getBooksByMood, { mood, limit: 20 });
    
    if (books.length === 0) {
      return [];
    }
    
    // Use AI to refine recommendations
    const prompt = `Based on the mood "${mood}", rank these books from most to least suitable. Consider the book's themes, tone, and emotional impact. Return only the book titles in order, separated by newlines.

Books:
${books.map(book => `- ${book.title} by ${book.author}: ${book.description.substring(0, 100)}...`).join('\n')}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const rankedTitles = response.choices[0].message.content?.split('\n').filter(line => line.trim());
      
      // Reorder books based on AI ranking
      const rankedBooks = [];
      for (const title of rankedTitles || []) {
        const book = books.find(b => title.includes(b.title));
        if (book && rankedBooks.length < limit) {
          rankedBooks.push(book);
        }
      }
      
      // Fill remaining slots with unranked books
      for (const book of books) {
        if (!rankedBooks.find(rb => rb._id === book._id) && rankedBooks.length < limit) {
          rankedBooks.push(book);
        }
      }
      
      return rankedBooks.slice(0, limit);
    } catch (error) {
      console.error("AI recommendation error:", error);
      return books.slice(0, limit);
    }
  },
});

export const getPersonalizedRecommendations = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    // Get user preferences
    const preferences = await ctx.runQuery(api.users.getUserPreferences, {});
    const recentReviews = await ctx.runQuery(api.reviews.getUserReviews, { limit: 10 });
    
    if (!preferences && recentReviews.length === 0) {
      // Return popular books for new users
      return await ctx.runQuery(api.books.getFeaturedBooks, {});
    }
    
    const favoriteGenres = preferences?.favoriteGenres || [];
    const preferredMoods = preferences?.preferredMoods || [];
    const likedBooks = recentReviews.filter(r => r.rating >= 4);
    
    // Create AI prompt for personalized recommendations
    const prompt = `Recommend books for a user with these preferences:
    
Favorite Genres: ${favoriteGenres.join(', ') || 'None specified'}
Preferred Moods: ${preferredMoods.join(', ') || 'None specified'}
Recently Liked Books: ${likedBooks.map(r => `${r.book?.title} by ${r.book?.author} (${r.rating}/5)`).join(', ') || 'None'}

Provide 5 book recommendations with brief explanations of why each book fits their preferences. Format as:
Title: [Book Title]
Author: [Author Name]
Reason: [Why this book matches their preferences]`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const aiRecommendations = response.choices[0].message.content || "";
      
      // Also get books from database based on preferences
      let dbBooks = [];
      if (favoriteGenres.length > 0) {
        for (const genre of favoriteGenres.slice(0, 2)) {
          const genreBooks = await ctx.runQuery(api.books.searchBooks, { genre, limit: 3 });
          dbBooks.push(...genreBooks);
        }
      }
      
      if (preferredMoods.length > 0) {
        for (const mood of preferredMoods.slice(0, 2)) {
          const moodBooks = await ctx.runQuery(api.books.getBooksByMood, { mood, limit: 3 });
          dbBooks.push(...moodBooks);
        }
      }
      
      // Remove duplicates
      const uniqueBooks = dbBooks.filter((book, index, self) => 
        index === self.findIndex(b => b._id === book._id)
      );
      
      return {
        aiRecommendations,
        books: uniqueBooks.slice(0, 8),
      };
    } catch (error) {
      console.error("Personalized recommendation error:", error);
      return {
        aiRecommendations: "Unable to generate AI recommendations at this time.",
        books: await ctx.runQuery(api.books.getFeaturedBooks, {}),
      };
    }
  },
});

export const saveRecommendation = mutation({
  args: {
    bookId: v.id("books"),
    reason: v.string(),
    mood: v.optional(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    return await ctx.db.insert("bookRecommendations", {
      userId,
      bookId: args.bookId,
      reason: args.reason,
      mood: args.mood,
      confidence: args.confidence,
      isViewed: false,
    });
  },
});

export const getUserRecommendations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    const recommendations = await ctx.db
      .query("bookRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);
    
    const enrichedRecommendations = [];
    for (const rec of recommendations) {
      const book = await ctx.db.get(rec.bookId);
      if (book) {
        enrichedRecommendations.push({
          ...rec,
          book,
        });
      }
    }
    
    return enrichedRecommendations;
  },
});
