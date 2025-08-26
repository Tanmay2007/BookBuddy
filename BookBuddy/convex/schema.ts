import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  books: defineTable({
    title: v.string(),
    author: v.string(),
    genre: v.array(v.string()),
    description: v.string(),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    publishedYear: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),
    price: v.optional(v.number()),
    mood: v.array(v.string()), // happy, sad, adventurous, curious, etc.
  })
    .index("by_genre", ["genre"])
    .index("by_mood", ["mood"])
    .searchIndex("search_books", {
      searchField: "title",
      filterFields: ["author", "genre"],
    }),

  reviews: defineTable({
    bookId: v.id("books"),
    userId: v.id("users"),
    rating: v.number(), // 1-5 stars
    review: v.optional(v.string()),
    isRecommended: v.boolean(),
  })
    .index("by_book", ["bookId"])
    .index("by_user", ["userId"])
    .index("by_book_and_user", ["bookId", "userId"]),

  readingLists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    bookIds: v.array(v.id("books")),
    isPublic: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    favoriteGenres: v.array(v.string()),
    preferredMoods: v.array(v.string()),
    readingGoals: v.optional(v.number()), // books per month
    spotifyPlaylistId: v.optional(v.string()),
  })
    .index("by_user", ["userId"]),

  chatSessions: defineTable({
    userId: v.id("users"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_updated", ["lastUpdated"]),

  bookRecommendations: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    reason: v.string(),
    mood: v.optional(v.string()),
    confidence: v.number(), // 0-1
    isViewed: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_viewed", ["userId", "isViewed"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
