
import { FigmaStepsState, FigmaStepsAction } from '../types/figmaStepsTypes';

// Initial State
export const initialState: FigmaStepsState = {
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
export function figmaStepsReducer(state: FigmaStepsState, action: FigmaStepsAction): FigmaStepsState {
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
