
import { useCallback } from 'react';
import { figmaApiService } from '@/services/figma-api-service';
import { enhancedCodeGenerationEngine } from '@/services/enhanced-code-generation-engine';
import { transformer } from '@/lib/transform';
import { StepData, UIState } from '../types/figmaStepsTypes';
import { combineCodePieces, combineCssCode } from './helpers';

interface UseBusinessLogicProps {
  stepData: StepData;
  setStepData: (data: Partial<StepData>) => void;
  setStepStatus: (status: any) => void;
  setError: (step: string, error: string) => void;
  clearErrors: () => void;
  setProgress: (progress: Partial<UIState['progress']>) => void;
}

export const useBusinessLogic = ({
  stepData,
  setStepData,
  setStepStatus,
  setError,
  clearErrors,
  setProgress
}: UseBusinessLogicProps) => {
  
  const connectToFigma = useCallback(async () => {
    const { figmaUrl, accessToken } = stepData;
    
    if (!figmaUrl.trim() || !accessToken.trim()) {
      setError('step1', 'Please provide both Figma URL and Access Token');
      return;
    }

    setStepStatus({ step1: 'loading' });
    clearErrors();
    setProgress({ current: 1, message: 'Connecting to Figma...' });

    try {
      const validation = await figmaApiService.validateFigmaUrl(figmaUrl);
      if (!validation.valid || !validation.fileId) {
        throw new Error(validation.error || 'Invalid Figma URL');
      }

      setProgress({ message: 'Fetching Figma file data...' });
      const figmaFile = await figmaApiService.fetchFigmaFile(validation.fileId, accessToken);
      
      setProgress({ message: 'Getting metadata...' });
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

      setStepData({ figmaData: completeData });
      setStepStatus({ step1: 'success' });
      setProgress({ message: 'Connection successful!' });

    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Connection failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('Access denied') || error.message.includes('403')) {
          errorMessage = 'Access denied. This Figma file requires authentication. Please provide a valid Figma Personal Access Token.';
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
  }, [stepData, setStepData, setStepStatus, setError, clearErrors, setProgress]);

  const generateSvgCode = useCallback(async (svgContent?: string) => {
    const svg = svgContent || stepData.svgCode;
    
    if (!svg.trim()) {
      setError('step2', 'Please provide SVG code');
      return;
    }

    setStepStatus({ step2: 'loading' });
    clearErrors();
    setProgress({ current: 2, message: 'Converting SVG to TSX...' });

    try {
      if (!svg.includes('<svg') && !svg.includes('<path') && !svg.includes('<rect') && !svg.includes('<circle')) {
        throw new Error('Invalid SVG: No SVG elements found in the provided code');
      }

      setProgress({ message: 'Parsing SVG structure...' });

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
  }, [stepData.svgCode, setStepData, setStepStatus, setError, clearErrors, setProgress]);

  const saveCssCode = useCallback(() => {
    if (!stepData.cssCode.trim()) {
      setError('step3', 'Please provide CSS code');
      return;
    }

    setStepStatus({ step3: 'success' });
    clearErrors();
    setProgress({ current: 3, message: 'CSS code saved successfully!' });
  }, [stepData.cssCode, setStepStatus, setError, clearErrors, setProgress]);

  const generateFinalCode = useCallback(async () => {
    const { jsxCode, moreCssCode } = stepData;
    
    if (!jsxCode.trim() && !moreCssCode.trim()) {
      setError('step4', 'Please provide JSX or additional CSS code');
      return;
    }

    setStepStatus({ step4: 'loading' });
    clearErrors();
    setProgress({ current: 4, message: 'Generating final code...' });

    try {
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
      
      const finalTsx = combineCodePieces(
        stepData.generatedTsxCode,
        stepData.jsxCode,
        stepData.figmaData
      );

      const finalCss = combineCssCode(
        stepData.cssCode,
        stepData.moreCssCode,
        stepData.figmaData
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
  }, [stepData, setStepData, setStepStatus, setError, clearErrors, setProgress]);

  const downloadCode = useCallback(() => {
    const { finalTsxCode, finalCssCode } = stepData;
    
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
  }, [stepData]);

  return {
    connectToFigma,
    generateSvgCode,
    saveCssCode,
    generateFinalCode,
    downloadCode
  };
};
