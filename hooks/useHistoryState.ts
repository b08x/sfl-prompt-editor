import { useState, useCallback } from 'react';

// Using JSON.stringify is a pragmatic way to check for value equality in this context.
// It's not universally robust but sufficient for the serializable prompt object.
const deepEquals = (a: any, b: any): boolean => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (e) {
    return false;
  }
};

export const useHistoryState = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const state = history[currentIndex];

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    // Resolve new state from function if necessary
    const resolvedState = typeof newState === 'function' 
      ? (newState as (prevState: T) => T)(history[currentIndex]) 
      : newState;

    // Prevent adding identical states to history
    if (deepEquals(resolvedState, history[currentIndex])) {
      return;
    }

    // This is a new state, so truncate any "future" history from an undo action
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(resolvedState);

    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  // Resets the history with a new initial state
  const resetState = useCallback((newState: T) => {
    // Check for equality to avoid re-render if the new state is the same as the only state in history.
    if (history.length === 1 && deepEquals(newState, history[0])) {
        return;
    }
    setHistory([newState]);
    setCurrentIndex(0);
  }, [history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo, resetState };
};
