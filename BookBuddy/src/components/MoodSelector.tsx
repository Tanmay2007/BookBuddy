import { useState } from "react";

interface MoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
}

const moods = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🗺️', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'sad', label: 'Melancholy', emoji: '😢', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'curious', label: 'Curious', emoji: '🤔', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'romantic', label: 'Romantic', emoji: '💕', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'mysterious', label: 'Mysterious', emoji: '🕵️', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'motivated', label: 'Motivated', emoji: '💪', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'contemplative', label: 'Contemplative', emoji: '🧘', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
];

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">How are you feeling today?</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodSelect(selectedMood === mood.id ? '' : mood.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedMood === mood.id
                ? `${mood.color} border-current shadow-md`
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="text-2xl mb-2">{mood.emoji}</div>
            <div className="font-medium text-sm">{mood.label}</div>
          </button>
        ))}
      </div>
      {selectedMood && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700">
            Great choice! We'll find books that match your {moods.find(m => m.id === selectedMood)?.label.toLowerCase()} mood.
          </p>
        </div>
      )}
    </div>
  );
}
