import React, { useState, useCallback, useEffect } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { CanvasPanel } from './components/CanvasPanel';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import { StructuredPrompt, GenerationHistoryItem, AnalysisTag, RewriteCandidate, EditorTab } from './types';
import { generateImage, deconstructPrompt, analyzeAndRewritePrompt } from './services/geminiService';
import { SparklesIcon } from './components/icons';

// This prompt is intentionally chosen to be complex and potentially sensitive
// to demonstrate the analysis and rewrite capabilities of the application upon loading.
const initialRawPrompt = `A political cartoon of Donald Trump being disciplined by Abraham Lincoln with a paddle labeled 'Democracy' near the White House. Tone: satirical.`;

// The structured prompt starts empty and will be populated by deconstructing the initial raw prompt.
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
  const [isDeconstructing, setIsDeconstructing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('structured');

  const [analysis, setAnalysis] = useState<AnalysisTag[]>([]);
  const [candidates, setCandidates] = useState<RewriteCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  
  // This effect runs once on mount to initialize the application state
  // by deconstructing and analyzing the initial prompt.
  useEffect(() => {
    const initApp = async () => {
      // We start in a loading state for both processes
      setIsDeconstructing(true);
      setIsAnalyzing(true);
      setError(null);
      
      try {
        // First, deconstruct the raw prompt into the structured editor
        const structured = await deconstructPrompt(initialRawPrompt);
        setPrompt(structured);
        
        // Then, analyze the prompt for risks and generate rewrites
        const result = await analyzeAndRewritePrompt(initialRawPrompt);
        setAnalysis(result.analysis);
        setCandidates(result.candidates);
        if (result.candidates.length > 0) {
            setSelectedCandidateId(result.candidates[0].id);
        }
        
        // Finally, switch to the analysis tab to show the results immediately
        setActiveTab('analysis');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        // Ensure loading states are cleared
        setIsDeconstructing(false);
        setIsAnalyzing(false);
      }
    };

    initApp();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const handleGenerate = useCallback(async (promptToUse: string) => {
    const trimmedPrompt = promptToUse.trim();
    if (!trimmedPrompt || trimmedPrompt === "A blank canvas.") {
      setError("Please provide a more descriptive prompt to generate an image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImage(trimmedPrompt);
      const newHistoryItem: GenerationHistoryItem = {
        id: new Date().toISOString(),
        imageUrl,
        prompt: prompt, // Use the current structured prompt for history
        rawPrompt: trimmedPrompt
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      setSelectedIndex(0);
    } catch (e) {
      let errorMessage = e instanceof Error ? e.message : String(e);
      // If the error is a safety block, provide a more helpful message and guide the user.
      if (errorMessage.includes("blocked for safety reasons")) {
          errorMessage += " Try using the 'Analysis' tab to get safer rewrite suggestions.";
          setActiveTab('analysis'); // Switch to the analysis tab to help them
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, setActiveTab]);

  const handleGenerateFromStructured = useCallback(() => {
    const constructedPrompt = constructRawPrompt(prompt);
    setRawPrompt(constructedPrompt);
    handleGenerate(constructedPrompt);
  }, [prompt, handleGenerate]);

  const handleGenerateFromRaw = useCallback(() => {
    handleGenerate(rawPrompt);
  }, [rawPrompt, handleGenerate]);

  const handleDeconstruct = useCallback(async () => {
    if (!rawPrompt.trim()) {
      setError("Cannot deconstruct an empty prompt.");
      return;
    }
    setIsDeconstructing(true);
    setError(null);
    try {
      const structured = await deconstructPrompt(rawPrompt);
      setPrompt(structured);
      setActiveTab('structured');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeconstructing(false);
    }
  }, [rawPrompt]);

  const handleAnalyze = useCallback(async () => {
    if (!rawPrompt.trim()) {
        setError("Cannot analyze an empty prompt.");
        return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalysis([]);
    setCandidates([]);
    setSelectedCandidateId(null);
    try {
        const result = await analyzeAndRewritePrompt(rawPrompt);
        setAnalysis(result.analysis);
        setCandidates(result.candidates);
        if (result.candidates.length > 0) {
            setSelectedCandidateId(result.candidates[0].id);
        }
    } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
    } finally {
        setIsAnalyzing(false);
    }
  }, [rawPrompt]);

  const handleApplyRewrite = useCallback(() => {
    if (!selectedCandidateId) return;
    const selected = candidates.find(c => c.id === selectedCandidateId);
    if (selected) {
        setRawPrompt(selected.text);
        setActiveTab('raw');
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
  
  // Sync raw prompt when structured prompt changes
  useEffect(() => {
    if(activeTab === 'structured') {
        const constructed = constructRawPrompt(prompt);
        setRawPrompt(constructed);
    }
  }, [prompt, activeTab]);

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
        <div className="md:col-span-1 h-[calc(100vh-100px)] min-h-[500px]">
          <EditorPanel 
            prompt={prompt}
            setPrompt={setPrompt}
            rawPrompt={rawPrompt}
            setRawPrompt={setRawPrompt}
            onGenerateFromStructured={handleGenerateFromStructured}
            onGenerateFromRaw={handleGenerateFromRaw}
            onDeconstruct={handleDeconstruct}
            onAnalyze={handleAnalyze}
            onApplyRewrite={handleApplyRewrite}
            isLoading={isLoading}
            isDeconstructing={isDeconstructing}
            isAnalyzing={isAnalyzing}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            analysis={analysis}
            candidates={candidates}
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