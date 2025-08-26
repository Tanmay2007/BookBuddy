import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addReview = mutation({
  args: {
    bookId: v.id("books"),
    rating: v.number(),
    review: v.optional(v.string()),
    isRecommended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add reviews");
    }
    
    // Check if user already reviewed this book
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_book_and_user", (q) => 
        q.eq("bookId", args.bookId).eq("userId", userId)
      )
      .first();
    
    if (existingReview) {
      // Update existing review
      await ctx.db.patch(existingReview._id, {
        rating: args.rating,
        review: args.review,
        isRecommended: args.isRecommended,
      });
      
      // Update book's average rating
      await updateBookRating(ctx, args.bookId);
      return existingReview._id;
    } else {
      // Create new review
      const reviewId = await ctx.db.insert("reviews", {
        bookId: args.bookId,
        userId,
        rating: args.rating,
        review: args.review,
        isRecommended: args.isRecommended,
      });
      
      // Update book's average rating
      await updateBookRating(ctx, args.bookId);
      return reviewId;
    }
  },
});

async function updateBookRating(ctx: any, bookId: any) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_book", (q: any) => q.eq("bookId", bookId))
    .collect();
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await ctx.db.patch(bookId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: reviews.length,
    });
  }
}

export const getBookReviews = query({
  args: {
    bookId: v.id("books"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .order("desc")
      .take(args.limit || 10);
    
    const enrichedReviews = [];
    for (const review of reviews) {
      const user = await ctx.db.get(review.userId);
      enrichedReviews.push({
        ...review,
        user: user ? { name: user.name, email: user.email } : null,
      });
    }
    
    return enrichedReviews;
  },
});

export const getUserReviews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 20);
    
    const enrichedReviews = [];
    for (const review of reviews) {
      const book = await ctx.db.get(review.bookId);
      enrichedReviews.push({
        ...review,
        book,
      });
    }
    
    return enrichedReviews;
  },
});

export const getUserReviewForBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    return await ctx.db
      .query("reviews")
      .withIndex("by_book_and_user", (q) => 
        q.eq("bookId", args.bookId).eq("userId", userId)
      )
      .first();
  },
});

export const deleteReview = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or unauthorized");
    }
    
    await ctx.db.delete(args.reviewId);
    
    // Update book's average rating
    await updateBookRating(ctx, review.bookId);
  },
});
