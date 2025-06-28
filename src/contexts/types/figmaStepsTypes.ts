
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

export interface FigmaStepsState {
  stepData: StepData;
  stepStatus: StepStatus;
  uiState: UIState;
}

// Action Types
export type FigmaStepsAction =
  | { type: 'SET_STEP_DATA'; payload: Partial<StepData> }
  | { type: 'SET_STEP_STATUS'; payload: Partial<StepStatus> }
  | { type: 'SET_UI_STATE'; payload: Partial<UIState> }
  | { type: 'SET_ERROR'; payload: { step: string; error: string } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'TOGGLE_BLOCK'; payload: keyof UIState['expandedBlocks'] }
  | { type: 'SET_PROGRESS'; payload: Partial<UIState['progress']> }
  | { type: 'RESET_ALL' };

export interface FigmaStepsContextType {
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
