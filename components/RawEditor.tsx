import React from 'react';
import { SparklesIcon } from './icons';

interface RawEditorProps {
  rawPrompt: string;
  setRawPrompt: (value: string) => void;
  onGenerate: () => void;
  onDeconstruct: () => void;
  isLoading: boolean;
  isDeconstructing: boolean;
}

export const RawEditor: React.FC<RawEditorProps> = ({ rawPrompt, setRawPrompt, onGenerate, onDeconstruct, isLoading, isDeconstructing }) => {
  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <textarea
        value={rawPrompt}
        onChange={(e) => setRawPrompt(e.target.value)}
        placeholder="Enter a full prompt here, or see the reconstructed prompt from the Structured Editor."
        className="w-full flex-grow bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-3 resize-none"
      />
      <div className="flex space-x-2">
        <button
          onClick={onDeconstruct}
          disabled={isDeconstructing || isLoading}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500"
        >
          {isDeconstructing ? 'Deconstructing...' : '[ Deconstruct ]'}
        </button>
        <button
          onClick={onGenerate}
          disabled={isLoading || isDeconstructing}
          className="w-full flex justify-center items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-indigo-400"
        >
          <SparklesIcon className="w-5 h-5"/>
          <span>{isLoading ? 'Generating...' : 'Generate'}</span>
        </button>
      </div>
    </div>
  );
};
