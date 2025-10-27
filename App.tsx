import React, { useState, useCallback, useEffect } from 'react';
import { CanvasPanel } from './components/CanvasPanel';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import { StructuredBreakdown } from './components/StructuredEditor';
import { AnalysisSuggestions } from './components/AnalysisPanel';
import { SavedPromptsPanel } from './components/SavedPromptsPanel';
import { VariationsPanel } from './components/VariationsPanel';
import { StructuredPrompt, GenerationHistoryItem, AnalysisTag, RewriteCandidate, SavedPromptItem, PromptVariation } from './types';
import { generateImage, deconstructPrompt, analyzeAndRewritePrompt, generatePromptVariations } from './services/geminiService';
import { SparklesIcon, BookmarkIcon, BeakerIcon } from './components/icons';
import { useHistoryState } from './hooks/useHistoryState';
import { useLocalStorage } from './hooks/useLocalStorage';

const initialRawPrompt = `A cinematic, wide-angle shot of a lone astronaut discovering a glowing, ancient alien artifact in a vast, red desert on Mars. The astronaut's helmet reflects the mysterious light of the object. Dramatic, epic tone.`;

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
  const { 
    state: prompt, 
    setState: setPrompt, 
    undo: undoPrompt, 
    redo: redoPrompt, 
    canUndo: canUndoPrompt, 
    canRedo: canRedoPrompt,
    resetState: resetPromptState
  } = useHistoryState<StructuredPrompt>(initialPromptState);

  const [rawPrompt, setRawPrompt] = useState<string>(initialRawPrompt);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generate');
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisTag[]>([]);
  const [candidates, setCandidates] = useState<RewriteCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  
  const [savedPrompts, setSavedPrompts] = useLocalStorage<SavedPromptItem[]>('prompt-inspector-saved', []);
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<boolean>(false);

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
        resetPromptState(structured);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setVariations([]);
    
    try {
      setLoadingMessage("Analyzing...");
      const [structured, analysisResult] = await Promise.all([
          deconstructPrompt(rawPrompt),
          analyzeAndRewritePrompt(rawPrompt)
      ]);
      resetPromptState(structured);
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
  }, [rawPrompt, resetPromptState]);

  const handleApplyRewrite = useCallback(async () => {
    if (!selectedCandidateId) return;
    const selected = candidates.find(c => c.id === selectedCandidateId);
    if (selected) {
        setRawPrompt(selected.text);
        setVariations([]);
        // Deconstruct the newly applied prompt to update the structured editor
        try {
            setIsLoading(true);
            setLoadingMessage("Analyzing...");
            const structured = await deconstructPrompt(selected.text);
            resetPromptState(structured);
        } catch(e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
            setLoadingMessage("Generate");
        }
    }
  }, [selectedCandidateId, candidates, resetPromptState]);

  const handleSelectHistoryItem = (index: number) => {
    setSelectedIndex(index);
    const selectedItem = history[index];
    if (selectedItem) {
      resetPromptState(selectedItem.prompt);
      setRawPrompt(selectedItem.rawPrompt);
      setVariations([]);
    }
  };
  
  const handleSavePrompt = () => {
    const trimmedRawPrompt = rawPrompt.trim();
    if (!trimmedRawPrompt) {
        setError("Cannot save an empty prompt.");
        return;
    }
    if (savedPrompts.some(p => p.rawPrompt === trimmedRawPrompt)) {
        setError("This prompt is already saved.");
        return;
    }

    const name = trimmedRawPrompt.split(' ').slice(0, 5).join(' ') + (trimmedRawPrompt.split(' ').length > 5 ? '...' : '');
    const newSavedItem: SavedPromptItem = {
        id: new Date().toISOString(),
        name: name,
        rawPrompt: trimmedRawPrompt,
        prompt: prompt,
    };
    setSavedPrompts(prev => [newSavedItem, ...prev]);
  };

  const handleLoadPrompt = useCallback(async (savedItem: SavedPromptItem) => {
    setIsLoading(true);
    setLoadingMessage("Loading...");
    setError(null);
    setVariations([]);
    try {
        setRawPrompt(savedItem.rawPrompt);
        resetPromptState(savedItem.prompt);

        const result = await analyzeAndRewritePrompt(savedItem.rawPrompt);
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
  }, [resetPromptState]);

  const handleDeletePrompt = (idToDelete: string) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== idToDelete));
  };

  const handleGenerateVariations = useCallback(async () => {
    const trimmedPrompt = rawPrompt.trim();
    if (!trimmedPrompt) {
      setError("Please provide a prompt to generate variations.");
      return;
    }
    setIsGeneratingVariations(true);
    setError(null);
    setVariations([]);
    try {
      const result = await generatePromptVariations(trimmedPrompt);
      setVariations(result);
    } catch(e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [rawPrompt]);

  const handleSelectVariation = useCallback(async (promptText: string) => {
    setIsLoading(true);
    setLoadingMessage("Loading...");
    setError(null);
    try {
        setRawPrompt(promptText);
        setVariations([]);

        const [structured, result] = await Promise.all([
            deconstructPrompt(promptText),
            analyzeAndRewritePrompt(promptText),
        ]);

        resetPromptState(structured);
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
  }, [resetPromptState]);


  useEffect(() => {
    const constructed = constructRawPrompt(prompt);
    // This effect can cause race conditions if the user is typing in the raw prompt box
    // at the same time the structured prompt is changing. For now, we assume one user action at a time.
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
            <div className="flex items-center space-x-2">
                <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                <SparklesIcon className={`w-5 h-5 ${isLoading && loadingMessage === 'Generating...' ? 'animate-pulse-fast' : ''}`} />
                <span>{loadingMessage}</span>
                </button>
                 <button
                    onClick={handleGenerateVariations}
                    disabled={isLoading || isGeneratingVariations}
                    title="Generate Variations"
                    className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    <BeakerIcon className={`w-5 h-5 ${isGeneratingVariations ? 'animate-pulse-fast' : ''}`} />
                </button>
                <button
                    onClick={handleSavePrompt}
                    disabled={isLoading}
                    title="Save Current Prompt"
                    className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    <BookmarkIcon />
                </button>
            </div>
          </div>
          
          <SavedPromptsPanel
            savedPrompts={savedPrompts}
            onLoadPrompt={handleLoadPrompt}
            onDeletePrompt={handleDeletePrompt}
          />
          <VariationsPanel
            variations={variations}
            onSelectVariation={handleSelectVariation}
            isLoading={isGeneratingVariations}
          />
          <StructuredBreakdown 
            prompt={prompt}
            setPrompt={setPrompt}
            undo={undoPrompt}
            redo={redoPrompt}
            canUndo={canUndoPrompt}
            canRedo={canRedoPrompt}
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
          <CanvasPanel imageUrl={currentImageUrl} isLoading={isLoading && loadingMessage === 'Generating...'} />
          <HistoryFilmstrip history={history} onSelect={handleSelectHistoryItem} selectedIndex={selectedIndex} />
        </div>
      </main>
    </div>
  );
}

export default App;