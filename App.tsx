import React, { useState, useCallback, useEffect } from 'react';
import { CanvasPanel } from './components/CanvasPanel';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import { StructuredBreakdown } from './components/StructuredEditor';
import { AnalysisSuggestions } from './components/AnalysisPanel';
import { StructuredPrompt, GenerationHistoryItem, AnalysisTag, RewriteCandidate } from './types';
import { generateImage, deconstructPrompt, analyzeAndRewritePrompt } from './services/geminiService';
import { SparklesIcon } from './components/icons';

const initialRawPrompt = `A political cartoon of Donald Trump being disciplined by Abraham Lincoln with a paddle labeled 'Democracy' near the White House. Tone: satirical.`;

const initialPromptState: StructuredPrompt = {
  frame: { style: '', tone: '' },
  scene: { subjects: [{ name: '', attribute: '' }], action: '' },
  context: { setting: '', details: '' },
};

const constructRawPrompt = (prompt: StructuredPrompt): string => {
    const stylePart = prompt.frame.style ? `A ${prompt.frame.style}` : 'An image';
    const tonePart = prompt.frame.tone ? ` in a ${prompt.frame.tone} mood` : '';
    const subjectsPart = prompt.scene.subjects
        .filter(s => s.name.trim() !== '')
        .map(s => `${s.name.trim()}${s.attribute.trim() ? ` ${s.attribute.trim()}` : ''}`)
        .join(' and ');
    const actionPart = prompt.scene.action.trim() ? ` ${prompt.scene.action.trim()}` : '';
    const settingPart = prompt.context.setting.trim() ? ` in ${prompt.context.setting.trim()}` : '';
    const detailsPart = prompt.context.details.trim() ? `. Notable details include ${prompt.context.details.trim()}` : '';

    if (!subjectsPart) return "A blank canvas.";

    return `${stylePart}${tonePart}. The image depicts ${subjectsPart}${actionPart}${settingPart}${detailsPart}.`;
};

function App() {
  const [prompt, setPrompt] = useState<StructuredPrompt>(initialPromptState);
  const [rawPrompt, setRawPrompt] = useState<string>(initialRawPrompt);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generate');
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisTag[]>([]);
  const [candidates, setCandidates] = useState<RewriteCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      setLoadingMessage("Analyzing...");
      setError(null);
      
      try {
        const [structured, result] = await Promise.all([
          deconstructPrompt(initialRawPrompt),
          analyzeAndRewritePrompt(initialRawPrompt)
        ]);
        setPrompt(structured);
        setAnalysis(result.analysis);
        setCandidates(result.candidates);
        if (result.candidates.length > 0) {
            setSelectedCandidateId(result.candidates[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
        setLoadingMessage("Generate");
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = rawPrompt.trim();
    if (!trimmedPrompt || trimmedPrompt === "A blank canvas.") {
      setError("Please provide a descriptive prompt to generate an image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      setLoadingMessage("Analyzing...");
      const [structured, analysisResult] = await Promise.all([
          deconstructPrompt(rawPrompt),
          analyzeAndRewritePrompt(rawPrompt)
      ]);
      setPrompt(structured);
      setAnalysis(analysisResult.analysis);
      setCandidates(analysisResult.candidates);

      setLoadingMessage("Generating...");
      const imageUrl = await generateImage(trimmedPrompt);
      const newHistoryItem: GenerationHistoryItem = {
        id: new Date().toISOString(),
        imageUrl,
        prompt: structured,
        rawPrompt: trimmedPrompt
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      setSelectedIndex(0);

    } catch (e) {
      let errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes("blocked for safety reasons")) {
          errorMessage += " Review the analysis for safer rewrite suggestions.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage("Generate");
    }
  }, [rawPrompt]);

  const handleApplyRewrite = useCallback(() => {
    if (!selectedCandidateId) return;
    const selected = candidates.find(c => c.id === selectedCandidateId);
    if (selected) {
        setRawPrompt(selected.text);
    }
  }, [selectedCandidateId, candidates]);

  const handleSelectHistoryItem = (index: number) => {
    setSelectedIndex(index);
    const selectedItem = history[index];
    if (selectedItem) {
      setPrompt(selectedItem.prompt);
      setRawPrompt(selectedItem.rawPrompt);
    }
  };
  
  useEffect(() => {
    const constructed = constructRawPrompt(prompt);
    setRawPrompt(constructed);
  }, [prompt]);

  const currentImageUrl = history.length > 0 ? history[selectedIndex]?.imageUrl : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
       <header className="bg-gray-800 p-3 shadow-lg flex items-center space-x-3 border-b border-gray-700">
          <SparklesIcon className="w-8 h-8 text-indigo-400" />
          <h1 className="text-xl font-bold">Prompt Inspector & Editor</h1>
      </header>
      
      {error && (
        <div className="bg-red-500 text-white p-3 text-center transition-opacity duration-300">
          {error}
        </div>
      )}

      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="md:col-span-1 h-[calc(100vh-100px)] min-h-[500px] flex flex-col space-y-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col space-y-4">
            <h2 className="text-lg font-semibold text-white">Prompt</h2>
            <textarea
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full flex-grow bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-3 resize-none"
              rows={5}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse-fast' : ''}`} />
              <span>{loadingMessage}</span>
            </button>
          </div>
          
          <StructuredBreakdown 
            prompt={prompt}
            setPrompt={setPrompt}
          />
          <AnalysisSuggestions
            analysis={analysis}
            candidates={candidates}
            onApplyRewrite={handleApplyRewrite}
            selectedCandidateId={selectedCandidateId}
            setSelectedCandidateId={setSelectedCandidateId}
          />
        </div>
        <div className="md:col-span-2 flex flex-col space-y-4">
          <CanvasPanel imageUrl={currentImageUrl} isLoading={isLoading} />
          <HistoryFilmstrip history={history} onSelect={handleSelectHistoryItem} selectedIndex={selectedIndex} />
        </div>
      </main>
    </div>
  );
}

export default App;
