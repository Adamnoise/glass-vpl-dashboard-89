
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { FigmaStepsContextType } from './types/figmaStepsTypes';
import { initialState, figmaStepsReducer } from './figmaSteps/reducer';
import { useBusinessLogic } from './figmaSteps/useBusinessLogic';

const FigmaStepsContext = createContext<FigmaStepsContextType | undefined>(undefined);

export const FigmaStepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(figmaStepsReducer, initialState);

  // Basic Actions
  const setStepData = useCallback((data: Partial<typeof state.stepData>) => {
    dispatch({ type: 'SET_STEP_DATA', payload: data });
  }, []);

  const setStepStatus = useCallback((status: Partial<typeof state.stepStatus>) => {
    dispatch({ type: 'SET_STEP_STATUS', payload: status });
  }, []);

  const setUIState = useCallback((uiState: Partial<typeof state.uiState>) => {
    dispatch({ type: 'SET_UI_STATE', payload: uiState });
  }, []);

  const setError = useCallback((step: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { step, error } });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const toggleBlock = useCallback((block: keyof typeof state.uiState.expandedBlocks) => {
    dispatch({ type: 'TOGGLE_BLOCK', payload: block });
  }, []);

  const setProgress = useCallback((progress: Partial<typeof state.uiState.progress>) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  // Business Logic
  const businessLogic = useBusinessLogic({
    stepData: state.stepData,
    setStepData,
    setStepStatus,
    setError,
    clearErrors,
    setProgress
  });

  const contextValue: FigmaStepsContextType = {
    state,
    actions: {
      setStepData,
      setStepStatus,
      setUIState,
      setError,
      clearErrors,
      toggleBlock,
      setProgress,
      resetAll,
      ...businessLogic
    }
  };

  return (
    <FigmaStepsContext.Provider value={contextValue}>
      {children}
    </FigmaStepsContext.Provider>
  );
};

export const useFigmaSteps = () => {
  const context = useContext(FigmaStepsContext);
  if (context === undefined) {
    throw new Error('useFigmaSteps must be used within a FigmaStepsProvider');
  }
  return context;
};

// Export types for backward compatibility
export type { StepData, StepStatus, UIState } from './types/figmaStepsTypes';
