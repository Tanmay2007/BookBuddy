import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ReadingListsProps {
  onSelectBook: (bookId: Id<"books">) => void;
}

export function ReadingLists({ onSelectBook }: ReadingListsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedList, setSelectedList] = useState<Id<"readingLists"> | null>(null);

  const userLists = useQuery(api.readingLists.getUserReadingLists, {});
  const publicLists = useQuery(api.readingLists.getPublicReadingLists, { limit: 10 });
  const selectedListDetails = useQuery(
    api.readingLists.getReadingList,
    selectedList ? { listId: selectedList } : "skip"
  );

  const createList = useMutation(api.readingLists.createReadingList);
  const deleteList = useMutation(api.readingLists.deleteReadingList);
  const removeFromList = useMutation(api.readingLists.removeBookFromList);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    try {
      await createList({
        name: listName,
        description: listDescription || undefined,
        isPublic,
      });
      toast.success("Reading list created!");
      setShowCreateForm(false);
      setListName("");
      setListDescription("");
      setIsPublic(false);
    } catch (error) {
      toast.error("Failed to create reading list");
    }
  };

  const handleDeleteList = async (listId: Id<"readingLists">) => {
    if (!confirm("Are you sure you want to delete this reading list?")) return;

    try {
      await deleteList({ listId });
      toast.success("Reading list deleted");
      if (selectedList === listId) {
        setSelectedList(null);
      }
    } catch (error) {
      toast.error("Failed to delete reading list");
    }
  };

  const handleRemoveBook = async (bookId: Id<"books">) => {
    if (!selectedList) return;

    try {
      await removeFromList({ listId: selectedList, bookId });
      toast.success("Book removed from list");
    } catch (error) {
      toast.error("Failed to remove book");
    }
  };

  if (selectedList && selectedListDetails) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedList(null)}
          className="mb-6 flex items-center text-purple-600 hover:text-purple-700"
        >
          ← Back to reading lists
        </button>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedListDetails.name}
              </h2>
              {selectedListDetails.description && (
                <p className="text-gray-600 mb-2">{selectedListDetails.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{selectedListDetails.books.length} books</span>
                {selectedListDetails.owner && (
                  <span>by {selectedListDetails.owner.name || selectedListDetails.owner.email}</span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedListDetails.isPublic 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedListDetails.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {selectedListDetails.books.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No books yet</h3>
            <p className="text-gray-600">Start adding books to this reading list!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedListDetails.books.map((book) => (
              <div key={book._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all">
                <div 
                  onClick={() => onSelectBook(book._id)}
                  className="cursor-pointer"
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-blue-100 rounded-t-lg flex items-center justify-center">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">📖</div>
                        <div className="text-sm font-medium text-gray-600 line-clamp-2">
                          {book.title}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                    
                    {book.averageRating && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">
                          {book.averageRating} ({book.totalRatings || 0})
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {book.genre.slice(0, 2).map((g) => (
                        <span key={g} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleRemoveBook(book._id)}
                    className="w-full text-sm text-red-600 hover:text-red-700 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove from List
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">My Reading Lists</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Create New List
        </button>
      </div>

      {/* Create List Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create Reading List</h3>
            
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Name *
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Summer Reading, Sci-Fi Favorites"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your reading list..."
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Make this list public</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create List
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User's Lists */}
      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Lists</h3>
        {userLists && userLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userLists.map((list) => (
              <div key={list._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900 line-clamp-2">{list.name}</h4>
                    <button
                      onClick={() => handleDeleteList(list._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  {list.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{list.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">{list.bookCount} books</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      list.isPublic 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {list.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedList(list._id)}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View List
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reading lists yet</h3>
            <p className="text-gray-600 mb-4">Create your first reading list to organize your favorite books!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First List
            </button>
          </div>
        )}
      </section>

      {/* Public Lists */}
      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Discover Public Lists</h3>
        {publicLists && publicLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicLists.map((list) => (
              <div key={list._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all">
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{list.name}</h4>
                  
                  {list.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{list.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">{list.bookCount} books</span>
                    {list.owner && (
                      <span className="text-xs text-gray-500">
                        by {list.owner.name || list.owner.email}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedList(list._id)}
                    className="w-full border border-purple-600 text-purple-600 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Explore List
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-600">No public lists available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
