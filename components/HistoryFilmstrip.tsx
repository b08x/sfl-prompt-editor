import React from 'react';
import { GenerationHistoryItem } from '../types';

interface HistoryFilmstripProps {
  history: GenerationHistoryItem[];
  onSelect: (index: number) => void;
  selectedIndex: number;
}

export const HistoryFilmstrip: React.FC<HistoryFilmstripProps> = ({ history, onSelect, selectedIndex }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gray-900 p-2">
      <h3 className="text-sm font-bold text-gray-400 mb-2 px-2">GENERATION HISTORY</h3>
      <div className="flex overflow-x-auto space-x-3 pb-2">
        {history.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(index)}
            className={`flex-shrink-0 w-28 h-28 rounded-md overflow-hidden focus:outline-none ring-2 ring-offset-2 ring-offset-gray-900 transition-all duration-200
              ${selectedIndex === index ? 'ring-indigo-500 scale-105' : 'ring-transparent hover:ring-indigo-400'}`}
          >
            <img src={item.imageUrl} alt={`History item ${index + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
