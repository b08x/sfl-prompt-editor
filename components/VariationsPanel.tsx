import React from 'react';
import { PromptVariation } from '../types';
import { BeakerIcon } from './icons';

interface VariationsPanelProps {
  variations: PromptVariation[];
  onSelectVariation: (promptText: string) => void;
  isLoading: boolean;
}

export const VariationsPanel: React.FC<VariationsPanelProps> = ({ variations, onSelectVariation, isLoading }) => {
  if (!isLoading && variations.length === 0) {
    return null;
  }

  return (
    <details className="bg-gray-800 rounded-lg" open>
      <summary className="p-4 cursor-pointer font-semibold text-lg text-indigo-400 w-full flex justify-between items-center">
        <span>Prompt Variations</span>
        {isLoading && <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-indigo-400"></div>}
      </summary>
      <div className="border-t border-gray-700 p-4 max-h-72 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-400 py-4">
            <p>Generating creative variations...</p>
          </div>
        ) : variations.length > 0 ? (
          <ul className="space-y-3">
            {variations.map((item) => (
              <li key={item.id} className="group bg-gray-900/50 p-3 rounded-md hover:bg-gray-900 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.prompt}</p>
                  </div>
                  <button 
                    onClick={() => onSelectVariation(item.prompt)}
                    className="ml-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Use
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">No variations generated yet.</p>
        )}
      </div>
    </details>
  );
};
