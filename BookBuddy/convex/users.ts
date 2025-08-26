import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const updateUserPreferences = mutation({
  args: {
    favoriteGenres: v.optional(v.array(v.string())),
    preferredMoods: v.optional(v.array(v.string())),
    readingGoals: v.optional(v.number()),
    spotifyPlaylistId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const updates: any = {};
    if (args.favoriteGenres !== undefined) updates.favoriteGenres = args.favoriteGenres;
    if (args.preferredMoods !== undefined) updates.preferredMoods = args.preferredMoods;
    if (args.readingGoals !== undefined) updates.readingGoals = args.readingGoals;
    if (args.spotifyPlaylistId !== undefined) updates.spotifyPlaylistId = args.spotifyPlaylistId;
    
    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("userPreferences", {
        userId,
        favoriteGenres: args.favoriteGenres || [],
        preferredMoods: args.preferredMoods || [],
        readingGoals: args.readingGoals,
        spotifyPlaylistId: args.spotifyPlaylistId,
      });
    }
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    // Get user's reviews count
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Get user's reading lists count
    const readingLists = await ctx.db
      .query("readingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Calculate total books in all lists
    const totalBooksInLists = readingLists.reduce((sum, list) => sum + list.bookIds.length, 0);
    
    // Calculate average rating given
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    return {
      reviewsCount: reviews.length,
      readingListsCount: readingLists.length,
      totalBooksInLists,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  },
});
