# BookBuddy – AI-Powered Book Matchmaker

BookBuddy is a modern web app that uses AI to recommend books based on your mood, favorite genres, or Spotify playlist. It includes an AI chatbot, personalized reading lists, ratings, reviews, and Razorpay integration for premium recommendations or book purchases.

---

## Features
- **Mood-based recommendations** using AI and Google Books API.
- **Spotify Playlist Integration** – analyze playlist mood for book suggestions.
- **AI Chatbot** for real-time recommendations.
- **Personalized Reading Lists** – save and organize books.
- **Ratings & Reviews** – community-driven feedback.
- **Authentication** – secure login/signup to save preferences.
- **Razorpay Payments** – purchase books or unlock premium AI features.

---

## Tech Stack
- **Frontend**: Next.js (App Router), React, TailwindCSS, Framer Motion
- **Backend**: Convex (queries, mutations, actions)
- **Auth**: NextAuth or Clerk
- **Payments**: Razorpay
- **APIs**: Spotify Web API, Google Books API
- **AI**: OpenAI or similar LLM API

---

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- npm or yarn
- Convex CLI:  
  ```bash
  npm install -g convex




Clone Repository

git clone https://github.com/your-username/bookbuddy.git
cd bookbuddy







Environment Variables

NEXT_PUBLIC_CONVEX_URL=your_convex_url
GOOGLE_BOOKS_API_KEY=your_key
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/callback
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
OPENAI_API_KEY=your_openai_key
NEXTAUTH_SECRET=your_secret_or_clerk_keys






Run Development Server

npm run dev







Deploy Backend (Convex)
convex deploy








Deploy Frontend (Vercel)
Go to Vercel,, import repository.
Add environment variables under Settings → Environment Variables.
Deploy – Vercel will provide a live URL.












