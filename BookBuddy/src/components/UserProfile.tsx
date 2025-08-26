import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { PaymentModal } from "./PaymentModal";

export function UserProfile() {
  const user = useQuery(api.auth.loggedInUser);
  const preferences = useQuery(api.users.getUserPreferences, {});
  const userStats = useQuery(api.users.getUserStats, {});
  const userReviews = useQuery(api.reviews.getUserReviews, { limit: 5 });
  
  const updatePreferences = useMutation(api.users.updateUserPreferences);
  const getSpotifyRecommendations = useAction(api.spotify.getPlaylistRecommendations);
  
  const [isEditing, setIsEditing] = useState(false);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [preferredMoods, setPreferredMoods] = useState<string[]>([]);
  const [readingGoals, setReadingGoals] = useState(0);
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState("");
  const [spotifyRecommendations, setSpotifyRecommendations] = useState<any>(null);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Update state when preferences load
  useEffect(() => {
    if (preferences) {
      setFavoriteGenres(preferences.favoriteGenres || []);
      setPreferredMoods(preferences.preferredMoods || []);
      setReadingGoals(preferences.readingGoals || 0);
      setSpotifyPlaylistId(preferences.spotifyPlaylistId || "");
    }
  }, [preferences]);

  const genres = [
    "Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction", 
    "Fantasy", "Biography", "History", "Self-Help", "Thriller", "Horror",
    "Comedy", "Drama", "Adventure", "Philosophy", "Poetry", "Art"
  ];

  const moods = [
    "happy", "adventurous", "sad", "curious", "romantic", "mysterious", 
    "motivated", "contemplative", "nostalgic", "hopeful", "dark", "uplifting"
  ];

  const handleSavePreferences = async () => {
    try {
      await updatePreferences({
        favoriteGenres,
        preferredMoods,
        readingGoals: readingGoals || undefined,
        spotifyPlaylistId: spotifyPlaylistId || undefined,
      });
      toast.success("Preferences updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const handleSpotifyRecommendations = async () => {
    if (!spotifyPlaylistId.trim()) {
      toast.error("Please enter a Spotify playlist ID");
      return;
    }

    setLoadingSpotify(true);
    try {
      const recommendations = await getSpotifyRecommendations({ 
        playlistId: spotifyPlaylistId 
      });
      setSpotifyRecommendations(recommendations);
      toast.success("Got recommendations from your Spotify playlist!");
    } catch (error) {
      toast.error("Failed to get Spotify recommendations. Make sure the playlist ID is correct.");
    } finally {
      setLoadingSpotify(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setPreferredMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  if (!user) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.name || "Book Lover"}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPremiumModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              ⭐ Go Premium
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Stats */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{userStats.reviewsCount}</div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{userStats.readingListsCount}</div>
              <div className="text-sm text-gray-600">Reading Lists</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{userStats.totalBooksInLists}</div>
              <div className="text-sm text-gray-600">Books Saved</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {userStats.averageRating > 0 ? userStats.averageRating : "—"}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Features Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🚀 Unlock Premium Features</h3>
            <p className="text-purple-100">Get unlimited AI recommendations, Spotify integration, and more!</p>
          </div>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Reading Preferences</h2>
        
        {isEditing ? (
          <div className="space-y-6">
            {/* Favorite Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Favorite Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      favoriteGenres.includes(genre)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Moods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Moods
              </label>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      preferredMoods.includes(mood)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Reading Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Reading Goal (books)
              </label>
              <input
                type="number"
                value={readingGoals}
                onChange={(e) => setReadingGoals(parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                max="50"
              />
            </div>

            {/* Spotify Integration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spotify Playlist ID (for music-based recommendations)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spotifyPlaylistId}
                  onChange={(e) => setSpotifyPlaylistId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 37i9dQZF1DXcBWIGoYBM5M"
                />
                <button
                  onClick={handleSpotifyRecommendations}
                  disabled={loadingSpotify}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loadingSpotify ? "Loading..." : "Get Recs"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Find your playlist ID in Spotify: Share → Copy link → Extract the ID from the URL
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSavePreferences}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Favorite Genres</h3>
              <div className="flex flex-wrap gap-2">
                {(preferences?.favoriteGenres || []).map((genre) => (
                  <span key={genre} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                    {genre}
                  </span>
                ))}
                {(!preferences?.favoriteGenres || preferences.favoriteGenres.length === 0) && (
                  <span className="text-gray-500 text-sm">No genres selected</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Preferred Moods</h3>
              <div className="flex flex-wrap gap-2">
                {(preferences?.preferredMoods || []).map((mood) => (
                  <span key={mood} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {mood}
                  </span>
                ))}
                {(!preferences?.preferredMoods || preferences.preferredMoods.length === 0) && (
                  <span className="text-gray-500 text-sm">No moods selected</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Monthly Reading Goal</h3>
              <span className="text-gray-700">
                {preferences?.readingGoals ? `${preferences.readingGoals} books per month` : "No goal set"}
              </span>
            </div>

            {preferences?.spotifyPlaylistId && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Spotify Playlist</h3>
                <span className="text-gray-700 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {preferences.spotifyPlaylistId}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spotify Recommendations */}
      {spotifyRecommendations && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Books Based on Your Spotify Playlist 🎵
          </h2>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm whitespace-pre-line">
              {spotifyRecommendations.explanation}
            </p>
          </div>
          {spotifyRecommendations.books && spotifyRecommendations.books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotifyRecommendations.books.map((book: any) => (
                <div key={book._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                  <p className="text-xs text-gray-500 line-clamp-3">{book.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Reviews */}
      {userReviews && userReviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h2>
          <div className="space-y-4">
            {userReviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {review.book?.title || "Unknown Book"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {review.book?.author || "Unknown Author"}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {review.review && (
                  <p className="text-gray-700 text-sm">{review.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Modal */}
      <PaymentModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        type="premium_subscription"
      />
    </div>
  );
}
