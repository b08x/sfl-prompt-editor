import React from 'react';
import { SavedPromptItem } from '../types';
import { TrashIcon } from './icons';

interface SavedPromptsPanelProps {
  savedPrompts: SavedPromptItem[];
  onLoadPrompt: (prompt: SavedPromptItem) => void;
  onDeletePrompt: (id: string) => void;
}

export const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({ savedPrompts, onLoadPrompt, onDeletePrompt }) => {
  return (
    <details className="bg-gray-800 rounded-lg">
      <summary className="p-4 cursor-pointer font-semibold text-lg text-indigo-400 w-full flex justify-between items-center">
        <span>Saved Prompts</span>
        <span className="text-sm bg-gray-700 text-indigo-300 rounded-full px-2 py-0.5">{savedPrompts.length}</span>
      </summary>
      <div className="border-t border-gray-700 p-4 max-h-60 overflow-y-auto">
        {savedPrompts.length > 0 ? (
          <ul className="space-y-3">
            {savedPrompts.map((item) => (
              <li key={item.id} className="group bg-gray-900/50 p-3 rounded-md flex items-center justify-between hover:bg-gray-900 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-1">{item.rawPrompt}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onLoadPrompt(item)}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrompt(item.id)
                    }}
                    title="Delete Prompt"
                    className="p-2 text-gray-400 hover:bg-red-900/50 hover:text-red-400 rounded-full transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">You have no saved prompts.</p>
        )}
      </div>
    </details>
  );
};