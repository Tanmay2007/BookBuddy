import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getChatSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    
    return session;
  },
});

export const sendMessage = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to chat");
    }
    
    // Get or create chat session
    let session = await ctx.runQuery(api.chat.getChatSession, {});
    
    const userMessage = {
      role: "user" as const,
      content: args.message,
      timestamp: Date.now(),
    };
    
    if (!session) {
      // Create new session
      session = {
        userId,
        messages: [userMessage],
        lastUpdated: Date.now(),
      };
    } else {
      // Add to existing session
      session.messages.push(userMessage);
      session.lastUpdated = Date.now();
    }
    
    // Get user preferences for context
    const preferences = await ctx.runQuery(api.users.getUserPreferences, {});
    const recentReviews = await ctx.runQuery(api.reviews.getUserReviews, { limit: 5 });
    
    // Build context for AI
    let context = "You are BookBuddy, an AI book recommendation assistant. Help users discover books based on their preferences, mood, and reading history. Be friendly, knowledgeable, and provide specific book recommendations when possible.\n\n";
    
    if (preferences) {
      context += `User preferences:\n`;
      if (preferences.favoriteGenres?.length > 0) {
        context += `- Favorite genres: ${preferences.favoriteGenres.join(', ')}\n`;
      }
      if (preferences.preferredMoods?.length > 0) {
        context += `- Preferred moods: ${preferences.preferredMoods.join(', ')}\n`;
      }
    }
    
    if (recentReviews.length > 0) {
      context += `\nRecent books they've rated:\n`;
      recentReviews.forEach(review => {
        if (review.book) {
          context += `- ${review.book.title} by ${review.book.author}: ${review.rating}/5 stars\n`;
        }
      });
    }
    
    // Prepare messages for OpenAI
    const messages = [
      { role: "system" as const, content: context },
      ...session.messages.slice(-10), // Keep last 10 messages for context
    ];
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });
      
      const assistantMessage = {
        role: "assistant" as const,
        content: response.choices[0].message.content || "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now(),
      };
      
      session.messages.push(assistantMessage);
      
      // Save or update session
      if (session._id) {
        await ctx.runMutation(api.chat.updateChatSession, {
          sessionId: session._id,
          messages: session.messages,
        });
      } else {
        await ctx.runMutation(api.chat.createChatSession, {
          messages: session.messages,
        });
      }
      
      return assistantMessage;
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant" as const,
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      
      session.messages.push(errorMessage);
      
      if (session._id) {
        await ctx.runMutation(api.chat.updateChatSession, {
          sessionId: session._id,
          messages: session.messages,
        });
      } else {
        await ctx.runMutation(api.chat.createChatSession, {
          messages: session.messages,
        });
      }
      
      return errorMessage;
    }
  },
});

export const createChatSession = mutation({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    return await ctx.db.insert("chatSessions", {
      userId,
      messages: args.messages,
      lastUpdated: Date.now(),
    });
  },
});

export const updateChatSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    await ctx.db.patch(args.sessionId, {
      messages: args.messages,
      lastUpdated: Date.now(),
    });
  },
});

export const clearChatSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
