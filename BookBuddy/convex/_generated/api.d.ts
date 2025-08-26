/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as books from "../books.js";
import type * as chat from "../chat.js";
import type * as http from "../http.js";
import type * as payments from "../payments.js";
import type * as readingLists from "../readingLists.js";
import type * as recommendations from "../recommendations.js";
import type * as reviews from "../reviews.js";
import type * as router from "../router.js";
import type * as spotify from "../spotify.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  books: typeof books;
  chat: typeof chat;
  http: typeof http;
  payments: typeof payments;
  readingLists: typeof readingLists;
  recommendations: typeof recommendations;
  reviews: typeof reviews;
  router: typeof router;
  spotify: typeof spotify;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
