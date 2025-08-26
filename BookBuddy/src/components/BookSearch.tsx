import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BookCard } from "./BookCard";
import { Id } from "../../convex/_generated/dataModel";

interface BookSearchProps {
  selectedMood: string;
  onSelectBook: (bookId: Id<"books">) => void;
}

export function BookSearch({ selectedMood, onSelectBook }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  
  const searchResults = useQuery(api.books.searchBooks, {
    query: searchQuery || undefined,
    genre: selectedGenre || undefined,
    mood: selectedMood || undefined,
    limit: 12,
  });

  const moodRecommendations = useAction(api.recommendations.getRecommendationsByMood);
  const personalizedRecs = useAction(api.recommendations.getPersonalizedRecommendations);
  
  const [moodBooks, setMoodBooks] = useState<any[]>([]);
  const [personalizedBooks, setPersonalizedBooks] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const genres = [
    "Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction", 
    "Fantasy", "Biography", "History", "Self-Help", "Thriller"
  ];

  useEffect(() => {
    if (selectedMood) {
      setLoading(true);
      moodRecommendations({ mood: selectedMood, limit: 6 })
        .then(setMoodBooks)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedMood, moodRecommendations]);

  useEffect(() => {
    setLoading(true);
    personalizedRecs()
      .then(setPersonalizedBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [personalizedRecs]);

  const featuredBooks = useQuery(api.books.getFeaturedBooks);

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search for books, authors, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {personalizedBooks.books && personalizedBooks.books.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h3>
          {personalizedBooks.aiRecommendations && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-purple-900 mb-2">AI Insights</h4>
              <div className="text-sm text-purple-800 whitespace-pre-line">
                {personalizedBooks.aiRecommendations}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personalizedBooks.books.slice(0, 8).map((book: any) => (
              <BookCard key={book._id} book={book} onSelect={onSelectBook} />
            ))}
          </div>
        </section>
      )}

      {/* Mood-based Recommendations */}
      {selectedMood && moodBooks.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Perfect for Your {selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Mood
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moodBooks.map((book) => (
                <BookCard key={book._id} book={book} onSelect={onSelectBook} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Search Results */}
      {(searchQuery || selectedGenre) && searchResults && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : `${selectedGenre} Books`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchResults.map((book) => (
              <BookCard key={book._id} book={book} onSelect={onSelectBook} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Books */}
      {!searchQuery && !selectedGenre && !selectedMood && featuredBooks && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Featured Books</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book._id} book={book} onSelect={onSelectBook} />
            ))}
          </div>
        </section>
      )}

      {/* No Results */}
      {((searchQuery || selectedGenre) && searchResults?.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600">Try adjusting your search terms or browse our featured books.</p>
        </div>
      )}
    </div>
  );
}
