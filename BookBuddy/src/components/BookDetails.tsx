import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentModal } from "./PaymentModal";

interface BookDetailsProps {
  bookId: Id<"books">;
  onBack: () => void;
}

export function BookDetails({ bookId, onBack }: BookDetailsProps) {
  const book = useQuery(api.books.getBookById, { bookId });
  const reviews = useQuery(api.reviews.getBookReviews, { bookId, limit: 10 });
  const userReview = useQuery(api.reviews.getUserReviewForBook, { bookId });
  const readingLists = useQuery(api.readingLists.getUserReadingLists, {});
  
  const addReview = useMutation(api.reviews.addReview);
  const addToList = useMutation(api.readingLists.addBookToList);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isRecommended, setIsRecommended] = useState(true);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!book) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const handleSubmitReview = async () => {
    try {
      await addReview({
        bookId,
        rating,
        review: reviewText || undefined,
        isRecommended,
      });
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewText("");
    } catch (error) {
      toast.error("Failed to submit review");
    }
  };

  const handleAddToList = async (listId: Id<"readingLists">) => {
    try {
      await addToList({ listId, bookId });
      toast.success("Book added to reading list!");
      setShowAddToList(false);
    } catch (error) {
      toast.error("Failed to add book to list");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-purple-600 hover:text-purple-700"
      >
        ← Back to books
      </button>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📖</div>
                  <div className="text-lg font-medium text-gray-600">
                    {book.title}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3 p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
              </div>
              {book.price && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">₹{book.price}</div>
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              )}
            </div>

            {book.averageRating && (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-400 text-xl">★</span>
                  <span className="text-lg font-semibold ml-1">{book.averageRating}</span>
                  <span className="text-gray-600 ml-1">({book.totalRatings} reviews)</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {book.genre.map((g) => (
                <span key={g} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                  {g}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {book.mood.map((m) => (
                <span key={m} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {m}
                </span>
              ))}
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">{book.description}</p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {userReview ? 'Update Review' : 'Write Review'}
              </button>
              <button
                onClick={() => setShowAddToList(true)}
                className="border border-purple-600 text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookId={bookId}
        bookTitle={book.title}
        bookPrice={book.price}
        type="book_purchase"
      />

      {/* Review Form */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {userReview ? 'Update Your Review' : 'Write a Review'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Review (optional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="Share your thoughts about this book..."
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isRecommended}
                  onChange={(e) => setIsRecommended(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">I recommend this book</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Submit Review
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to List Modal */}
      {showAddToList && readingLists && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add to Reading List</h3>
            
            <div className="space-y-2 mb-4">
              {readingLists.map((list) => (
                <button
                  key={list._id}
                  onClick={() => handleAddToList(list._id)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{list.name}</div>
                  <div className="text-sm text-gray-600">{list.bookCount} books</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddToList(false)}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                    <div className="flex">
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
                  {review.isRecommended && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                {review.review && (
                  <p className="text-gray-700 text-sm">{review.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
