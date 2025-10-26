import React from 'react';
import { StructuredPrompt } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface StructuredBreakdownProps {
  prompt: StructuredPrompt;
  setPrompt: React.Dispatch<React.SetStateAction<StructuredPrompt>>;
}

const InputField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white px-3 py-2"
    />
  </div>
);

export const StructuredBreakdown: React.FC<StructuredBreakdownProps> = ({ prompt, setPrompt }) => {
  const handleFrameChange = (field: 'style' | 'tone') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(p => ({ ...p, frame: { ...p.frame, [field]: e.target.value } }));
  };

  const handleSceneChange = (field: 'action') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(p => ({ ...p, scene: { ...p.scene, [field]: e.target.value } }));
  };

  const handleContextChange = (field: 'setting' | 'details') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(p => ({ ...p, context: { ...p.context, [field]: e.target.value } }));
  };

  const handleSubjectChange = (index: number, field: 'name' | 'attribute') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubjects = [...prompt.scene.subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: e.target.value };
    setPrompt(p => ({ ...p, scene: { ...p.scene, subjects: newSubjects } }));
  };
  
  const addSubject = () => {
    setPrompt(p => ({ ...p, scene: { ...p.scene, subjects: [...p.scene.subjects, { name: '', attribute: '' }] } }));
  };

  const removeSubject = (index: number) => {
    if (prompt.scene.subjects.length > 1) {
      const newSubjects = prompt.scene.subjects.filter((_, i) => i !== index);
      setPrompt(p => ({ ...p, scene: { ...p.scene, subjects: newSubjects } }));
    }
  };

  return (
    <details className="bg-gray-800 rounded-lg" open>
      <summary className="p-4 cursor-pointer font-semibold text-lg text-indigo-400 w-full text-left">
        Structured Breakdown
      </summary>
      <div className="space-y-6 p-4 border-t border-gray-700">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-300">FRAME</h3>
          <InputField label="Style / Genre" value={prompt.frame.style} onChange={handleFrameChange('style')} placeholder="e.g., Photorealistic photo, 3D render" />
          <InputField label="Tone / Mood" value={prompt.frame.tone} onChange={handleFrameChange('tone')} placeholder="e.g., Satirical, Humorous, Epic" />
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-300">SCENE</h3>
          {prompt.scene.subjects.map((subject, index) => (
            <div key={index} className="p-3 border border-gray-700 rounded-md space-y-3 relative bg-gray-900/50">
              <p className="text-sm font-medium text-gray-400">Subject {index + 1}</p>
              <InputField label="Main Subject" value={subject.name} onChange={handleSubjectChange(index, 'name')} placeholder="e.g., Donald Trump, a robot" />
              <InputField label="...as / with Attribute" value={subject.attribute} onChange={handleSubjectChange(index, 'attribute')} placeholder="e.g., as a petulant child" />
              {prompt.scene.subjects.length > 1 && (
                <button onClick={() => removeSubject(index)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}
          <button onClick={addSubject} className="flex items-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300">
            <PlusIcon />
            <span>Add Subject</span>
          </button>
          <InputField label="Action / Process" value={prompt.scene.action} onChange={handleSceneChange('action')} placeholder="e.g., is disciplining, sits on" />
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-300">CONTEXT</h3>
          <InputField label="Setting / Location" value={prompt.context.setting} onChange={handleContextChange('setting')} placeholder="e.g., on the White House lawn" />
          <InputField label="Key Objects / Details" value={prompt.context.details} onChange={handleContextChange('details')} placeholder="e.g., a broken gavel, lens flare" />
        </div>
      </div>
    </details>
  );
};
