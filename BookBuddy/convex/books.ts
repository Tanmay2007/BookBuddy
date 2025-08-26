import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const searchBooks = query({
  args: {
    query: v.optional(v.string()),
    genre: v.optional(v.string()),
    mood: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, genre, mood, limit = 20 } = args;
    
    let books;
    
    if (query) {
      books = await ctx.db
        .query("books")
        .withSearchIndex("search_books", (q) => q.search("title", query))
        .take(limit);
    } else if (mood) {
      const allBooks = await ctx.db.query("books").collect();
      books = allBooks.filter(book => book.mood.includes(mood)).slice(0, limit);
    } else if (genre) {
      const allBooks = await ctx.db.query("books").collect();
      books = allBooks.filter(book => book.genre.includes(genre)).slice(0, limit);
    } else {
      books = await ctx.db.query("books").take(limit);
    }
    
    return books;
  },
});

export const getBookById = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookId);
  },
});

export const getBooksByMood = query({
  args: { mood: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { mood, limit = 10 } = args;
    
    const allBooks = await ctx.db.query("books").collect();
    return allBooks.filter(book => book.mood.includes(mood)).slice(0, limit);
  },
});

export const getFeaturedBooks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("books")
      .filter((q) => q.gte(q.field("averageRating"), 4.0))
      .take(12);
  },
});

export const addBook = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    genre: v.array(v.string()),
    description: v.string(),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    publishedYear: v.optional(v.number()),
    price: v.optional(v.number()),
    mood: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add books");
    }
    
    return await ctx.db.insert("books", {
      ...args,
      averageRating: 0,
      totalRatings: 0,
    });
  },
});

// Seed some sample books
export const seedBooks = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleBooks = [
      {
        title: "The Midnight Library",
        author: "Matt Haig",
        genre: ["Fiction", "Philosophy", "Contemporary"],
        description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
        mood: ["curious", "contemplative", "hopeful"],
        averageRating: 4.2,
        totalRatings: 1250,
        price: 12.99,
        publishedYear: 2020,
      },
      {
        title: "Dune",
        author: "Frank Herbert",
        genre: ["Science Fiction", "Adventure", "Epic"],
        description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
        mood: ["adventurous", "epic", "mysterious"],
        averageRating: 4.5,
        totalRatings: 2100,
        price: 14.99,
        publishedYear: 1965,
      },
      {
        title: "The Seven Husbands of Evelyn Hugo",
        author: "Taylor Jenkins Reid",
        genre: ["Romance", "Historical Fiction", "Drama"],
        description: "Reclusive Hollywood icon Evelyn Hugo finally decides to tell her life story—but only to unknown journalist Monique Grant.",
        mood: ["romantic", "dramatic", "nostalgic"],
        averageRating: 4.6,
        totalRatings: 1800,
        price: 13.99,
        publishedYear: 2017,
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        genre: ["Self-Help", "Psychology", "Productivity"],
        description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes, remarkable results.",
        mood: ["motivated", "focused", "optimistic"],
        averageRating: 4.4,
        totalRatings: 3200,
        price: 16.99,
        publishedYear: 2018,
      },
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        genre: ["Thriller", "Mystery", "Psychological"],
        description: "Alicia Berenson's life is seemingly perfect. Then one evening she shoots her husband and never speaks again.",
        mood: ["suspenseful", "dark", "intriguing"],
        averageRating: 4.1,
        totalRatings: 1600,
        price: 11.99,
        publishedYear: 2019,
      },
      {
        title: "Educated",
        author: "Tara Westover",
        genre: ["Memoir", "Biography", "Education"],
        description: "A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
        mood: ["inspiring", "emotional", "enlightening"],
        averageRating: 4.3,
        totalRatings: 2400,
        price: 15.99,
        publishedYear: 2018,
      },
    ];

    for (const book of sampleBooks) {
      await ctx.db.insert("books", book);
    }
    
    return `Seeded ${sampleBooks.length} books`;
  },
});
