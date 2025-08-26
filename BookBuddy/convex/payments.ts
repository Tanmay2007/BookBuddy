"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createRazorpayOrder = action({
  args: {
    amount: v.number(), // Amount in paise (INR)
    bookId: v.optional(v.id("books")),
    type: v.union(v.literal("book_purchase"), v.literal("premium_subscription")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to make purchases");
    }

    try {
      // In a real implementation, you would:
      // 1. Initialize Razorpay with your API keys
      // 2. Create an order using Razorpay API
      // 3. Store the order details in your database
      
      // For demonstration, we'll return a mock order
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In production, use actual Razorpay SDK:
      /*
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: args.amount,
        currency: 'INR',
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: {
          userId,
          bookId: args.bookId,
          type: args.type,
        },
      });
      */

      // Mock order response
      const order = {
        id: orderId,
        amount: args.amount,
        currency: 'INR',
        status: 'created',
      };

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key", // Your Razorpay key ID
      };
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new Error("Failed to create payment order");
    }
  },
});

export const verifyPayment = action({
  args: {
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    razorpaySignature: v.string(),
    bookId: v.optional(v.id("books")),
    type: v.union(v.literal("book_purchase"), v.literal("premium_subscription")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    try {
      // In production, verify the payment signature:
      /*
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== args.razorpaySignature) {
        throw new Error('Payment verification failed');
      }
      */

      // For demo purposes, we'll assume payment is successful
      console.log("Payment verified:", {
        orderId: args.razorpayOrderId,
        paymentId: args.razorpayPaymentId,
        userId,
        type: args.type,
      });

      // Here you would:
      // 1. Update user's purchase history
      // 2. Grant access to premium features if it's a subscription
      // 3. Send confirmation email
      // 4. Update book purchase count, etc.

      return {
        success: true,
        message: args.type === "book_purchase" 
          ? "Book purchased successfully!" 
          : "Premium subscription activated!",
      };
    } catch (error) {
      console.error("Payment verification failed:", error);
      throw new Error("Payment verification failed");
    }
  },
});

export const getPremiumFeatures = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // In a real app, you'd check the user's subscription status
    // For demo, we'll return premium features info
    return {
      features: [
        "Unlimited AI book recommendations",
        "Advanced mood-based filtering",
        "Spotify playlist integration",
        "Priority customer support",
        "Early access to new features",
        "Export reading lists",
        "Advanced reading analytics",
      ],
      monthlyPrice: 299, // ₹2.99 in paise
      yearlyPrice: 2999, // ₹29.99 in paise
      yearlyDiscount: "Save 17%",
    };
  },
});
