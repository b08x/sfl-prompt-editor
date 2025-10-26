import React from 'react';

interface CanvasPanelProps {
  imageUrl: string | null;
  isLoading: boolean;
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="bg-gray-900 aspect-square rounded-lg flex items-center justify-center p-4 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
            <p className="mt-4 text-lg">Generating masterpiece...</p>
        </div>
      )}
      {imageUrl ? (
        <img src={imageUrl} alt="Generated art" className="max-w-full max-h-full object-contain rounded-md" />
      ) : (
        <div className="text-center text-gray-500">
          <p className="text-2xl font-semibold">Prompt Inspector</p>
          <p>Your generated images will appear here.</p>
        </div>
      )}
    </div>
  );
};
