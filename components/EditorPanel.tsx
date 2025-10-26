import React from 'react';
import { StructuredEditor } from './StructuredEditor';
import { RawEditor } from './RawEditor';
import { AnalysisPanel } from './AnalysisPanel';
import { StructuredPrompt, AnalysisTag, RewriteCandidate, EditorTab } from '../types';

interface EditorPanelProps {
    prompt: StructuredPrompt;
    setPrompt: React.Dispatch<React.SetStateAction<StructuredPrompt>>;
    rawPrompt: string;
    setRawPrompt: (value: string) => void;
    onGenerateFromStructured: () => void;
    onGenerateFromRaw: () => void;
    onDeconstruct: () => void;
    onAnalyze: () => void;
    onApplyRewrite: () => void;
    isLoading: boolean;
    isDeconstructing: boolean;
    isAnalyzing: boolean;
    activeTab: EditorTab;
    setActiveTab: (tab: EditorTab) => void;
    analysis: AnalysisTag[];
    candidates: RewriteCandidate[];
    selectedCandidateId: string | null;
    setSelectedCandidateId: (id: string | null) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = (props) => {
    const {
        prompt, setPrompt, rawPrompt, setRawPrompt, onGenerateFromStructured, onGenerateFromRaw,
        onDeconstruct, onAnalyze, onApplyRewrite, isLoading, isDeconstructing, isAnalyzing,
        activeTab, setActiveTab, analysis, candidates, selectedCandidateId, setSelectedCandidateId
    } = props;

    const getTabClass = (tabName: EditorTab) =>
        `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 ${
        activeTab === tabName
            ? 'bg-gray-800 text-white'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`;

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-700 bg-gray-900 px-2 pt-2">
                <button onClick={() => setActiveTab('structured')} className={getTabClass('structured')}>
                    Structured Editor
                </button>
                <button onClick={() => setActiveTab('raw')} className={getTabClass('raw')}>
                    Raw Prompt
                </button>
                <button onClick={() => setActiveTab('analysis')} className={getTabClass('analysis')}>
                    Analysis
                </button>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-900">
                {activeTab === 'structured' && (
                    <StructuredEditor
                        prompt={prompt}
                        setPrompt={setPrompt}
                        onGenerate={onGenerateFromStructured}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === 'raw' && (
                    <RawEditor
                        rawPrompt={rawPrompt}
                        setRawPrompt={setRawPrompt}
                        onGenerate={onGenerateFromRaw}
                        onDeconstruct={onDeconstruct}
                        isLoading={isLoading}
                        isDeconstructing={isDeconstructing}
                    />
                )}
                {activeTab === 'analysis' && (
                   <AnalysisPanel
                        analysis={analysis}
                        candidates={candidates}
                        onAnalyze={onAnalyze}
                        onApplyRewrite={onApplyRewrite}
                        isLoading={isAnalyzing}
                        selectedCandidateId={selectedCandidateId}
                        setSelectedCandidateId={setSelectedCandidateId}
                   />
                )}
            </div>
        </div>
    );
};
