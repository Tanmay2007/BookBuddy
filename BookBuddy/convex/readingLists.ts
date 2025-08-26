import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createReadingList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create reading lists");
    }
    
    return await ctx.db.insert("readingLists", {
      userId,
      name: args.name,
      description: args.description,
      bookIds: [],
      isPublic: args.isPublic,
    });
  },
});

export const getUserReadingLists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    const lists = await ctx.db
      .query("readingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const enrichedLists = [];
    for (const list of lists) {
      const books = [];
      for (const bookId of list.bookIds) {
        const book = await ctx.db.get(bookId);
        if (book) {
          books.push(book);
        }
      }
      enrichedLists.push({
        ...list,
        books,
        bookCount: books.length,
      });
    }
    
    return enrichedLists;
  },
});

export const getReadingList = query({
  args: { listId: v.id("readingLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      return null;
    }
    
    const userId = await getAuthUserId(ctx);
    
    // Check if user can access this list
    if (!list.isPublic && list.userId !== userId) {
      return null;
    }
    
    const books = [];
    for (const bookId of list.bookIds) {
      const book = await ctx.db.get(bookId);
      if (book) {
        books.push(book);
      }
    }
    
    const owner = await ctx.db.get(list.userId);
    
    return {
      ...list,
      books,
      owner: owner ? { name: owner.name, email: owner.email } : null,
    };
  },
});

export const addBookToList = mutation({
  args: {
    listId: v.id("readingLists"),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId) {
      throw new Error("Reading list not found or unauthorized");
    }
    
    // Check if book is already in the list
    if (list.bookIds.includes(args.bookId)) {
      return; // Already in list
    }
    
    await ctx.db.patch(args.listId, {
      bookIds: [...list.bookIds, args.bookId],
    });
  },
});

export const removeBookFromList = mutation({
  args: {
    listId: v.id("readingLists"),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId) {
      throw new Error("Reading list not found or unauthorized");
    }
    
    await ctx.db.patch(args.listId, {
      bookIds: list.bookIds.filter(id => id !== args.bookId),
    });
  },
});

export const updateReadingList = mutation({
  args: {
    listId: v.id("readingLists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId) {
      throw new Error("Reading list not found or unauthorized");
    }
    
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    
    await ctx.db.patch(args.listId, updates);
  },
});

export const deleteReadingList = mutation({
  args: { listId: v.id("readingLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId) {
      throw new Error("Reading list not found or unauthorized");
    }
    
    await ctx.db.delete(args.listId);
  },
});

export const getPublicReadingLists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("readingLists")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .take(args.limit || 20);
    
    const enrichedLists = [];
    for (const list of lists) {
      const owner = await ctx.db.get(list.userId);
      const bookCount = list.bookIds.length;
      
      enrichedLists.push({
        ...list,
        owner: owner ? { name: owner.name, email: owner.email } : null,
        bookCount,
      });
    }
    
    return enrichedLists;
  },
});
