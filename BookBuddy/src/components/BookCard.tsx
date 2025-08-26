import { Id } from "../../convex/_generated/dataModel";

interface BookCardProps {
  book: {
    _id: Id<"books">;
    title: string;
    author: string;
    genre: string[];
    description: string;
    coverUrl?: string;
    averageRating?: number;
    totalRatings?: number;
    price?: number;
    mood: string[];
  };
  onSelect: (bookId: Id<"books">) => void;
}

export function BookCard({ book, onSelect }: BookCardProps) {
  return (
    <div 
      onClick={() => onSelect(book._id)}
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-blue-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📖</div>
            <div className="text-sm font-medium text-gray-600 line-clamp-2">
              {book.title}
            </div>
          </div>
        )}
        {book.price && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            ${book.price}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
        
        <div className="flex items-center gap-2 mb-2">
          {book.averageRating && (
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {book.averageRating} ({book.totalRatings || 0})
              </span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {book.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {book.genre.slice(0, 2).map((g) => (
            <span key={g} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {g}
            </span>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-1">
          {book.mood.slice(0, 3).map((m) => (
            <span key={m} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
