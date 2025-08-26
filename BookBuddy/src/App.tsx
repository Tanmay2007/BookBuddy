import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { BookSearch } from "./components/BookSearch";
import { MoodSelector } from "./components/MoodSelector";
import { ChatBot } from "./components/ChatBot";
import { ReadingLists } from "./components/ReadingLists";
import { UserProfile } from "./components/UserProfile";
import { BookDetails } from "./components/BookDetails";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [activeTab, setActiveTab] = useState<'discover' | 'chat' | 'lists' | 'profile'>('discover');
  const [selectedBookId, setSelectedBookId] = useState<Id<"books"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BB</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              BookBuddy
            </h1>
          </div>
          
          <Authenticated>
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'discover' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'chat' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                AI Chat
              </button>
              <button
                onClick={() => setActiveTab('lists')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'lists' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                My Lists
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Profile
              </button>
            </nav>
          </Authenticated>
          
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  BookBuddy
                </h1>
                <p className="text-xl text-gray-600 mb-2">AI-Powered Book Matchmaker</p>
                <p className="text-gray-500">
                  Discover your next favorite book with personalized AI recommendations
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {selectedBookId ? (
              <BookDetails 
                bookId={selectedBookId} 
                onBack={() => setSelectedBookId(null)} 
              />
            ) : (
              <>
                {activeTab === 'discover' && (
                  <DiscoverTab onSelectBook={setSelectedBookId} />
                )}
                {activeTab === 'chat' && <ChatBot />}
                {activeTab === 'lists' && <ReadingLists onSelectBook={setSelectedBookId} />}
                {activeTab === 'profile' && <UserProfile />}
              </>
            )}
          </div>
        </Authenticated>
      </main>
      
      <Toaster />
    </div>
  );
}

function DiscoverTab({ onSelectBook }: { onSelectBook: (bookId: Id<"books">) => void }) {
  const [selectedMood, setSelectedMood] = useState<string>('');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Discover Your Next Great Read
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let our AI help you find the perfect book based on your mood, preferences, and reading history.
        </p>
      </div>

      <MoodSelector selectedMood={selectedMood} onMoodSelect={setSelectedMood} />
      
      <BookSearch selectedMood={selectedMood} onSelectBook={onSelectBook} />
    </div>
  );
}
