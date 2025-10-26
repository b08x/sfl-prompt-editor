import React from 'react';
import { AnalysisTag, RewriteCandidate, AnalysisCategory } from '../types';

interface AnalysisSuggestionsProps {
  analysis: AnalysisTag[];
  candidates: RewriteCandidate[];
  onApplyRewrite: () => void;
  selectedCandidateId: string | null;
  setSelectedCandidateId: (id: string | null) => void;
}

const categoryColorMap: Record<AnalysisCategory, string> = {
    entity: 'bg-blue-900 border-blue-700',
    process: 'bg-green-900 border-green-700',
    tone: 'bg-purple-900 border-purple-700',
    risk: 'bg-red-900 border-red-700',
    other: 'bg-gray-700 border-gray-600',
};

const categoryTextMap: Record<AnalysisCategory, string> = {
    entity: 'text-blue-300',
    process: 'text-green-300',
    tone: 'text-purple-300',
    risk: 'text-red-300',
    other: 'text-gray-300',
};

export const AnalysisSuggestions: React.FC<AnalysisSuggestionsProps> = ({
  analysis,
  candidates,
  onApplyRewrite,
  selectedCandidateId,
  setSelectedCandidateId
}) => {
  const hasContent = analysis.length > 0 || candidates.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <details className="bg-gray-800 rounded-lg" open>
      <summary className="p-4 cursor-pointer font-semibold text-lg text-indigo-400 w-full text-left">
        Analysis &amp; Suggestions
      </summary>
      <div className="p-4 border-t border-gray-700 space-y-6">
        {analysis.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-300 mb-2">Prompt Analysis</h3>
            <div className="space-y-2">
              {analysis.map((tag) => (
                  <div key={tag.id} className={`p-3 rounded-md border ${categoryColorMap[tag.category]}`}>
                      <div className="flex justify-between items-center">
                          <strong className="text-white font-medium">{tag.span}</strong>
                          <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${categoryColorMap[tag.category]} ${categoryTextMap[tag.category]}`}>{tag.category}</span>
                      </div>
                      {tag.detail && <p className="text-sm text-gray-400 mt-1">{tag.detail}</p>}
                      {typeof tag.weight === 'number' && (
                          <div className="mt-2 h-1 w-full bg-gray-600 rounded">
                              <div className="h-1 bg-red-500 rounded" style={{ width: `${tag.weight * 100}%` }}></div>
                          </div>
                      )}
                  </div>
              ))}
            </div>
          </div>
        )}

        {candidates.length > 0 && (
           <div>
            <h3 className="text-base font-semibold text-gray-300 mb-2">Rewrite Candidates</h3>
            <div className="space-y-2">
              {candidates.map((c) => (
                  <label key={c.id} className={`block p-3 border rounded-md cursor-pointer transition-all ${selectedCandidateId === c.id ? 'ring-2 ring-indigo-500 bg-gray-800 border-indigo-600' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}`}>
                     <div className="flex items-start gap-3">
                         <input
                              type="radio"
                              name="candidate"
                              checked={selectedCandidateId === c.id}
                              onChange={() => setSelectedCandidateId(c.id)}
                              className="mt-1.5 h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                          />
                          <div>
                              <strong className="font-semibold text-white">{c.title}</strong>
                              <p className="text-sm text-gray-300 mt-1">{c.text}</p>
                              {c.rationale && <p className="text-xs text-gray-500 mt-2 italic">Rationale: {c.rationale}</p>}
                          </div>
                     </div>
                  </label>
              ))}
            </div>
          </div>
        )}
        
        {candidates.length > 0 && (
              <button
                onClick={onApplyRewrite}
                disabled={!selectedCandidateId}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-green-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Apply Selected Rewrite
              </button>
        )}
      </div>
    </details>
  );
};
