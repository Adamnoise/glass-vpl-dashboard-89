
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  Link
} from 'lucide-react';
import { useFigmaSteps } from '@/contexts/FigmaStepsContext';
import { getStatusIcon } from '../utils/statusUtils';
import { errorHandler } from '../utils/errorHandler';

// Import refactored components and hooks
import { FormState } from './step1/types';
import { useFormValidation } from './step1/useFormValidation';
import { useConnectionStatus } from './step1/useConnectionStatus';
import { FormFields } from './step1/FormFields';
import { ConnectionProgress } from './step1/ConnectionProgress';
import { FigmaDataDisplay } from './step1/FigmaDataDisplay';

export const Step1Configuration: React.FC = () => {
  const { state, actions } = useFigmaSteps();
  const { stepData, stepStatus, uiState } = state;
  
  const [formState, setFormState] = useState<FormState>({
    figmaUrl: stepData.figmaUrl,
    accessToken: stepData.accessToken,
  });
  
  const { validationState, validateInputs } = useFormValidation();
  const { connectionStatus, setConnectionStatus, connectionMetrics, setConnectionMetrics } = useConnectionStatus();

  // Enhanced input change handler
  const handleInputChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const newFormState = { ...formState, [field]: value };
      setFormState(newFormState);
      actions.setStepData({ [field]: value });
      
      // Clear previous errors when user starts typing
      if (uiState.errors.step1) {
        actions.setError('step1', '');
      }
      
      validateInputs(newFormState.figmaUrl, newFormState.accessToken);
    },
    [actions, formState, validateInputs, uiState.errors.step1]
  );

  // Enhanced connection handler with metrics
  const handleConnect = useCallback(async () => {
    if (!validationState.isFigmaUrlValid || !validationState.isAccessTokenValid) {
      actions.setError('step1', 'Please fix validation errors before connecting');
      return;
    }

    const startTime = Date.now();
    setConnectionMetrics(prev => ({ 
      ...prev, 
      startTime, 
      retryCount: prev.retryCount + 1 
    }));
    
    setConnectionStatus({ 
      isConnected: false, 
      isConnecting: true,
      responseTime: undefined 
    });

    try {
      await actions.connectToFigma();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      setConnectionMetrics(prev => ({ 
        ...prev, 
        endTime, 
        responseTime 
      }));

      // Determine connection quality based on response time
      let connectionQuality: 'excellent' | 'good' | 'poor' = 'excellent';
      if (responseTime > 5000) connectionQuality = 'poor';
      else if (responseTime > 2000) connectionQuality = 'good';

      setConnectionStatus({ 
        isConnected: true, 
        isConnecting: false,
        lastConnected: new Date(),
        connectionQuality,
        responseTime
      });
      
    } catch (error) {
      const errorMessage = errorHandler.handleError(
        error instanceof Error ? error : new Error('Unknown connection error'),
        'step1'
      );
      
      actions.setError('step1', errorMessage);
      setConnectionStatus({ 
        isConnected: false, 
        isConnecting: false,
        error: errorMessage
      });
    }
  }, [actions, validationState, setConnectionMetrics, setConnectionStatus]);

  // Auto-save form state
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (formState.figmaUrl !== stepData.figmaUrl || formState.accessToken !== stepData.accessToken) {
        actions.setStepData(formState);
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [formState, stepData, actions]);

  const isLoading = stepStatus.step1 === 'loading' || connectionStatus.isConnecting;
  const isSuccess = stepStatus.step1 === 'success' && connectionStatus.isConnected;
  const hasError = stepStatus.step1 === 'error';
  const error = uiState.errors.step1;

  return (
    <Card className="bg-gray-800 border-gray-700 transition-all duration-300 hover:border-gray-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
            1
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              Figma Configuration
              {getStatusIcon(stepStatus.step1)}
            </div>
            <div className="text-sm text-gray-400 font-normal">
              Connect to your Figma project
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Progress */}
        <ConnectionProgress 
          isLoading={isLoading} 
          connectionMetrics={connectionMetrics} 
        />

        {/* Form Fields */}
        <FormFields
          formState={formState}
          validationState={validationState}
          isLoading={isLoading}
          onInputChange={handleInputChange}
        />

        {/* Error Display */}
        {hasError && error && (
          <Alert className="border-red-600 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              <div className="font-medium mb-1">Connection Failed</div>
              <div className="text-sm">{error}</div>
              {error.includes('Access denied') && (
                <div className="mt-2 text-xs">
                  💡 Try: Check your access token or make sure the file is accessible
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Connect Button */}
        <Button
          onClick={handleConnect}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          disabled={
            isLoading || 
            !formState.figmaUrl || 
            !formState.accessToken ||
            !validationState.isFigmaUrlValid ||
            !validationState.isAccessTokenValid
          }
          aria-label="Connect to Figma"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to Figma...
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              Connect to Figma
            </>
          )}
        </Button>

        {/* Success Display */}
        <FigmaDataDisplay
          isSuccess={isSuccess}
          figmaData={stepData.figmaData}
          connectionStatus={connectionStatus}
          connectionMetrics={connectionMetrics}
          isExpanded={uiState.expandedBlocks.block1}
          onToggleExpanded={() => actions.toggleBlock('block1')}
        />
      </CardContent>
    </Card>
  );
};
