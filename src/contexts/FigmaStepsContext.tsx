import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { figmaApiService } from '@/services/figma-api-service';
import { enhancedCodeGenerationEngine } from '@/services/enhanced-code-generation-engine';
import { svgToJsx } from '@/lib/svg-to-jsx';
import { transformer } from '@/lib/transform';

// Types
export interface StepData {
  figmaUrl: string;
  accessToken: string;
  figmaData: any;
  svgCode: string;
  generatedTsxCode: string;
  cssCode: string;
  jsxCode: string;
  moreCssCode: string;
  finalTsxCode: string;
  finalCssCode: string;
}

export interface StepStatus {
  step1: 'idle' | 'loading' | 'success' | 'error';
  step2: 'idle' | 'loading' | 'success' | 'error';
  step3: 'idle' | 'loading' | 'success' | 'error';
  step4: 'idle' | 'loading' | 'success' | 'error';
}

export interface UIState {
  expandedBlocks: {
    block1: boolean;
    block2: boolean;
    block3: boolean;
    block4: boolean;
  };
  previewMode: boolean;
  errors: Record<string, string>;
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

interface FigmaStepsState {
  stepData: StepData;
  stepStatus: StepStatus;
  uiState: UIState;
}

// Action Types
type FigmaStepsAction =
  | { type: 'SET_STEP_DATA'; payload: Partial<StepData> }
  | { type: 'SET_STEP_STATUS'; payload: Partial<StepStatus> }
  | { type: 'SET_UI_STATE'; payload: Partial<UIState> }
  | { type: 'SET_ERROR'; payload: { step: string; error: string } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'TOGGLE_BLOCK'; payload: keyof UIState['expandedBlocks'] }
  | { type: 'SET_PROGRESS'; payload: Partial<UIState['progress']> }
  | { type: 'RESET_ALL' };

// Initial State
const initialState: FigmaStepsState = {
  stepData: {
    figmaUrl: 'https://www.figma.com/design/...',
    accessToken: '',
    figmaData: null,
    svgCode: '',
    generatedTsxCode: '',
    cssCode: '',
    jsxCode: '',
    moreCssCode: '',
    finalTsxCode: '',
    finalCssCode: ''
  },
  stepStatus: {
    step1: 'idle',
    step2: 'idle',
    step3: 'idle',
    step4: 'idle'
  },
  uiState: {
    expandedBlocks: {
      block1: false,
      block2: false,
      block3: false,
      block4: false
    },
    previewMode: false,
    errors: {},
    progress: {
      current: 0,
      total: 4,
      message: ''
    }
  }
};

// Reducer
function figmaStepsReducer(state: FigmaStepsState, action: FigmaStepsAction): FigmaStepsState {
  switch (action.type) {
    case 'SET_STEP_DATA':
      return {
        ...state,
        stepData: { ...state.stepData, ...action.payload }
      };
    
    case 'SET_STEP_STATUS':
      return {
        ...state,
        stepStatus: { ...state.stepStatus, ...action.payload }
      };
    
    case 'SET_UI_STATE':
      return {
        ...state,
        uiState: { ...state.uiState, ...action.payload }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          errors: { ...state.uiState.errors, [action.payload.step]: action.payload.error }
        }
      };
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        uiState: { ...state.uiState, errors: {} }
      };
    
    case 'TOGGLE_BLOCK':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          expandedBlocks: {
            ...state.uiState.expandedBlocks,
            [action.payload]: !state.uiState.expandedBlocks[action.payload]
          }
        }
      };
    
    case 'SET_PROGRESS':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          progress: { ...state.uiState.progress, ...action.payload }
        }
      };
    
    case 'RESET_ALL':
      return initialState;
    
    default:
      return state;
  }
}

// Context
interface FigmaStepsContextType {
  state: FigmaStepsState;
  actions: {
    setStepData: (data: Partial<StepData>) => void;
    setStepStatus: (status: Partial<StepStatus>) => void;
    setUIState: (uiState: Partial<UIState>) => void;
    setError: (step: string, error: string) => void;
    clearErrors: () => void;
    toggleBlock: (block: keyof UIState['expandedBlocks']) => void;
    setProgress: (progress: Partial<UIState['progress']>) => void;
    resetAll: () => void;
    
    // Business Logic Actions
    connectToFigma: () => Promise<void>;
    generateSvgCode: (svgContent?: string) => Promise<void>;
    saveCssCode: () => void;
    generateFinalCode: () => Promise<void>;
    downloadCode: () => void;
  };
}

const FigmaStepsContext = createContext<FigmaStepsContextType | undefined>(undefined);

// Provider Component
export const FigmaStepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(figmaStepsReducer, initialState);

  // Basic Actions
  const setStepData = useCallback((data: Partial<StepData>) => {
    dispatch({ type: 'SET_STEP_DATA', payload: data });
  }, []);

  const setStepStatus = useCallback((status: Partial<StepStatus>) => {
    dispatch({ type: 'SET_STEP_STATUS', payload: status });
  }, []);

  const setUIState = useCallback((uiState: Partial<UIState>) => {
    dispatch({ type: 'SET_UI_STATE', payload: uiState });
  }, []);

  const setError = useCallback((step: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { step, error } });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const toggleBlock = useCallback((block: keyof UIState['expandedBlocks']) => {
    dispatch({ type: 'TOGGLE_BLOCK', payload: block });
  }, []);

  const setProgress = useCallback((progress: Partial<UIState['progress']>) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  // Auto-generate SVG function (fixed dependencies)
  const autoGenerateSvg = useCallback(async (figmaData: any, fileId: string) => {
    setStepStatus({ step2: 'loading' });
    setProgress({ current: 2, message: 'Extracting SVG from Figma...' });

    try {
      // Extract SVG from Figma data
      const svgContent = await enhancedCodeGenerationEngine.extractSVGFromFigma(figmaData.file);
      
      setStepData({ svgCode: svgContent });
      setProgress({ message: 'SVG extracted successfully!' });
      setStepStatus({ step2: 'success' });

    } catch (error) {
      console.error('SVG generation error:', error);
      setError('step2', error instanceof Error ? error.message : 'SVG generation failed');
      setStepStatus({ step2: 'error' });
      setProgress({ message: 'SVG generation failed' });
    }
  }, [setStepData, setStepStatus, setError, setProgress]);

  // Generate SVG code function (fixed dependencies)
  const generateSvgCode = useCallback(async (svgContent?: string) => {
    const svg = svgContent || state.stepData.svgCode;
    
    if (!svg.trim()) {
      setError('step2', 'Please provide SVG code');
      return;
    }

    setStepStatus({ step2: 'loading' });
    clearErrors();
    setProgress({ current: 2, message: 'Converting SVG to TSX...' });

    try {
      // Validate SVG content first
      if (!svg.includes('<svg') && !svg.includes('<path') && !svg.includes('<rect') && !svg.includes('<circle')) {
        throw new Error('Invalid SVG: No SVG elements found in the provided code');
      }

      setProgress({ message: 'Parsing SVG structure...' });

      // Transform to TSX with proper typing using the enhanced transformer
      const tsxCode = await transformer(svg, {
        framework: 'react',
        typescript: true,
        styling: 'css',
        componentName: 'GeneratedComponent',
        passProps: true
      });

      setStepData({ 
        svgCode: svg,
        generatedTsxCode: tsxCode 
      });
      setStepStatus({ step2: 'success' });
      setProgress({ message: 'TSX code generated successfully!' });

    } catch (error) {
      console.error('SVG to TSX conversion error:', error);
      let errorMessage = 'SVG conversion failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('Invalid SVG')) {
          errorMessage = `${error.message}. Please ensure your input contains valid SVG elements like <svg>, <path>, <rect>, etc.`;
        } else if (error.message.includes('parsing')) {
          errorMessage = 'SVG parsing failed. Please check your SVG syntax and try again.';
        }
      }
      
      setError('step2', errorMessage);
      setStepStatus({ step2: 'error' });
      setProgress({ message: 'SVG conversion failed' });
    }
  }, [state.stepData.svgCode, setStepData, setStepStatus, setError, clearErrors, setProgress]);

  // Connect to Figma function (fixed - removed auto-trigger)  
  const connectToFigma = useCallback(async () => {
    const { figmaUrl, accessToken } = state.stepData;
    
    if (!figmaUrl.trim() || !accessToken.trim()) {
      setError('step1', 'Please provide both Figma URL and Access Token');
      return;
    }

    setStepStatus({ step1: 'loading' });
    clearErrors();
    setProgress({ current: 1, message: 'Connecting to Figma...' });

    try {
      // Validate URL
      const validation = await figmaApiService.validateFigmaUrl(figmaUrl);
      if (!validation.valid || !validation.fileId) {
        throw new Error(validation.error || 'Invalid Figma URL');
      }

      setProgress({ message: 'Fetching Figma file data...' });

      // Fetch complete Figma file data
      const figmaFile = await figmaApiService.fetchFigmaFile(validation.fileId, accessToken);
      
      setProgress({ message: 'Getting metadata...' });
      
      // Get additional metadata
      const metadata = await figmaApiService.getFileMetadata(validation.fileId, accessToken);
      const components = await figmaApiService.getFileComponents(validation.fileId, accessToken);
      const styles = await figmaApiService.getFileStyles(validation.fileId, accessToken);

      const completeData = {
        file: figmaFile,
        metadata,
        components,
        styles,
        fileId: validation.fileId,
        extractedAt: new Date().toISOString()
      };

      // Batch state updates to reduce re-renders
      setStepData({ figmaData: completeData });
      setStepStatus({ step1: 'success' });
      setProgress({ message: 'Connection successful!' });

      // Trigger Step 2 automatically after successful connection
      await autoGenerateSvg(completeData, validation.fileId);

    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Connection failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more helpful error messages
        if (error.message.includes('Access denied') || error.message.includes('403')) {
          errorMessage = 'Access denied. This Figma file requires authentication. Please provide a valid Figma Personal Access Token. You can generate one from your Figma account settings under "Personal access tokens".';
        } else if (error.message.includes('404')) {
          errorMessage = 'Figma file not found. Please check if the file exists and the URL is correct.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Invalid or expired access token. Please check your Figma Personal Access Token and try again.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        }
      }
      
      setError('step1', errorMessage);
      setStepStatus({ step1: 'error' });
      setProgress({ message: 'Connection failed' });
    }
  }, [state.stepData, setStepData, setStepStatus, setError, clearErrors, setProgress, autoGenerateSvg]);

  const saveCssCode = useCallback(() => {
    if (!state.stepData.cssCode.trim()) {
      setError('step3', 'Please provide CSS code');
      return;
    }

    setStepStatus({ step3: 'success' });
    clearErrors();
    setProgress({ current: 3, message: 'CSS code saved successfully!' });
  }, [state.stepData.cssCode, setStepStatus, setError, clearErrors, setProgress]);

  const generateFinalCode = useCallback(async () => {
    const { jsxCode, moreCssCode } = state.stepData;
    
    if (!jsxCode.trim() && !moreCssCode.trim()) {
      setError('step4', 'Please provide JSX or additional CSS code');
      return;
    }

    setStepStatus({ step4: 'loading' });
    clearErrors();
    setProgress({ current: 4, message: 'Generating final code...' });

    try {
      // Combine all data for final generation
      const config = {
        framework: 'react' as const,
        typescript: true,
        styling: 'css' as const,
        componentLibrary: 'custom' as const,
        optimization: {
          treeshaking: true,
          bundleAnalysis: true,
          codesplitting: true,
          lazyLoading: true,
        },
        accessibility: {
          wcagLevel: 'AA' as const,
          screenReader: true,
          keyboardNavigation: true,
          colorContrast: true,
        },
        testing: {
          unitTests: false,
          integrationTests: false,
          e2eTests: false,
          visualRegression: false,
        },
      };

      setProgress({ message: 'Optimizing code...' });

      // Generate final optimized code
      const generatedCode = await enhancedCodeGenerationEngine.generateCode(
        state.stepData.figmaData?.file,
        config,
        (progress, status) => {
          setProgress({ message: status });
        }
      );

      setProgress({ message: 'Combining code pieces...' });

      // Combine all code pieces
      const finalTsx = combineCodePieces(
        state.stepData.generatedTsxCode,
        state.stepData.jsxCode,
        state.stepData.figmaData
      );

      const finalCss = combineCssCode(
        state.stepData.cssCode,
        state.stepData.moreCssCode,
        state.stepData.figmaData
      );

      setStepData({
        finalTsxCode: finalTsx,
        finalCssCode: finalCss
      });

      setStepStatus({ step4: 'success' });
      setProgress({ message: 'Final code generated successfully!' });

    } catch (error) {
      console.error('Final generation error:', error);
      setError('step4', error instanceof Error ? error.message : 'Generation failed');
      setStepStatus({ step4: 'error' });
      setProgress({ message: 'Generation failed' });
    }
  }, [state.stepData, setStepData, setStepStatus, setError, clearErrors, setProgress]);

  const downloadCode = useCallback(() => {
    const { finalTsxCode, finalCssCode } = state.stepData;
    
    if (!finalTsxCode || !finalCssCode) return;

    // Download TSX file
    const tsxBlob = new Blob([finalTsxCode], { type: 'text/plain' });
    const tsxUrl = URL.createObjectURL(tsxBlob);
    const tsxLink = document.createElement('a');
    tsxLink.href = tsxUrl;
    tsxLink.download = 'GeneratedComponent.tsx';
    tsxLink.click();
    URL.revokeObjectURL(tsxUrl);

    // Download CSS file
    const cssBlob = new Blob([finalCssCode], { type: 'text/plain' });
    const cssUrl = URL.createObjectURL(cssBlob);
    const cssLink = document.createElement('a');
    cssLink.href = cssUrl;
    cssLink.download = 'GeneratedComponent.css';
    cssLink.click();
    URL.revokeObjectURL(cssUrl);
  }, [state.stepData]);

  // Helper functions
  const combineCodePieces = (generatedTsx: string, manualJsx: string, figmaData: any): string => {
    let finalCode = generatedTsx;

    // If manual JSX is provided, integrate it
    if (manualJsx.trim()) {
      // Find the return statement and add manual JSX as children or additional elements
      const returnMatch = finalCode.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
      if (returnMatch) {
        const originalJsx = returnMatch[1].trim();
        
        // If the original JSX is an SVG, wrap both in a fragment
        if (originalJsx.startsWith('<svg')) {
          const mergedJsx = `
    <React.Fragment>
      ${originalJsx}
      {/* Additional JSX */}
      ${manualJsx}
    </React.Fragment>`;
          finalCode = finalCode.replace(returnMatch[0], `return (${mergedJsx}\n  );`);
        } else {
          // Otherwise, append to existing structure
          const mergedJsx = `${originalJsx}\n      {/* Additional JSX */}\n      ${manualJsx}`;
          finalCode = finalCode.replace(returnMatch[0], `return (\n    ${mergedJsx}\n  );`);
        }
      }
    }

    // Add Figma metadata as comments
    if (figmaData) {
      const metadata = `/*
 * Generated from Figma Design
 * File: ${figmaData.file?.name || 'Unknown'}
 * Generated: ${new Date().toISOString()}
 * Components: ${figmaData.metadata?.componentCount || 0}
 * Styles: ${figmaData.metadata?.styleCount || 0}
 */

`;
      finalCode = metadata + finalCode;
    }

    return finalCode;
  };

  const combineCssCode = (baseCss: string, additionalCss: string, figmaData: any): string => {
    let finalCss = '';

    // Add header comment
    if (figmaData) {
      finalCss += `/*
 * Styles for Figma Component: ${figmaData.file?.name || 'Unknown'}
 * Generated: ${new Date().toISOString()}
 */

`;
    }

    // Add base CSS
    if (baseCss.trim()) {
      finalCss += `/* Base Styles */
${baseCss}

`;
    }

    // Add additional CSS
    if (additionalCss.trim()) {
      finalCss += `/* Additional Styles */
${additionalCss}

`;
    }

    // Add responsive utilities
    finalCss += `/* Responsive Utilities */
@media (max-width: 768px) {
  .figma-component {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .figma-component {
    padding: 0.5rem;
  }
}`;

    return finalCss;
  };

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
      connectToFigma,
      generateSvgCode,
      saveCssCode,
      generateFinalCode,
      downloadCode
    }
  };

  return (
    <FigmaStepsContext.Provider value={contextValue}>
      {children}
    </FigmaStepsContext.Provider>
  );
};

// Custom Hook
export const useFigmaSteps = () => {
  const context = useContext(FigmaStepsContext);
  if (context === undefined) {
    throw new Error('useFigmaSteps must be used within a FigmaStepsProvider');
  }
  return context;
};
