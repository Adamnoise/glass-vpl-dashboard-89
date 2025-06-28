import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Link, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Shield,
  Globe,
  Clock,
  Database
} from 'lucide-react';
import { useFigmaSteps } from '@/contexts/FigmaStepsContext';
import { getStatusIcon } from '../utils/statusUtils';
import { errorHandler } from '../utils/errorHandler';

// Enhanced debounce with cleanup
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): [(...args: Parameters<T>) => void, () => void] {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
    if (callNow) func(...args);
  };
  
  const cleanup = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return [debounced, cleanup];
}

interface FormState {
  figmaUrl: string;
  accessToken: string;
}

interface ValidationState {
  isFigmaUrlValid: boolean;
  isAccessTokenValid: boolean;
  urlValidationMessage?: string;
  tokenValidationMessage?: string;
}

interface FigmaConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  connectionQuality?: 'excellent' | 'good' | 'poor';
  responseTime?: number;
  error?: string;
}

interface ConnectionMetrics {
  startTime: number;
  endTime?: number;
  responseTime?: number;
  dataSize?: number;
  retryCount: number;
}

/**
 * Step 1: Enhanced Figma Configuration Component
 * 🎯 Features:
 * - Real-time URL validation with detailed feedback
 * - Connection quality monitoring
 * - Enhanced error handling with recovery suggestions
 * - Performance metrics tracking
 * - Accessibility optimized
 * - Progressive enhancement
 */
export const Step1Configuration: React.FC = () => {
  const { state, actions } = useFigmaSteps();
  const { stepData, stepStatus, uiState } = state;
  
  const [formState, setFormState] = useState<FormState>({
    figmaUrl: stepData.figmaUrl,
    accessToken: stepData.accessToken,
  });
  
  const [validationState, setValidationState] = useState<ValidationState>({
    isFigmaUrlValid: true,
    isAccessTokenValid: true,
  });
  
  const [connectionStatus, setConnectionStatus] = useState<FigmaConnectionStatus>({
    isConnected: false,
    isConnecting: false,
  });
  
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    startTime: 0,
    retryCount: 0,
  });

  // Enhanced URL validation with detailed feedback
  const validateFigmaUrl = useCallback((url: string): { valid: boolean; message?: string } => {
    if (!url.trim()) {
      return { valid: false, message: 'URL is required' };
    }

    const figmaUrlPatterns = [
      /^https:\/\/(?:www\.)?figma\.com\/file\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
      /^https:\/\/(?:www\.)?figma\.com\/proto\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
      /^https:\/\/(?:www\.)?figma\.com\/design\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
    ];

    const isValid = figmaUrlPatterns.some(pattern => pattern.test(url));
    
    if (!isValid) {
      if (!url.includes('figma.com')) {
        return { valid: false, message: 'Must be a Figma URL (figma.com)' };
      }
      if (!url.startsWith('https://')) {
        return { valid: false, message: 'URL must use HTTPS protocol' };
      }
      return { valid: false, message: 'Invalid Figma file/design/proto URL format' };
    }

    return { valid: true };
  }, []);

  // Enhanced token validation
  const validateAccessToken = useCallback((token: string): { valid: boolean; message?: string } => {
    if (!token.trim()) {
      return { valid: false, message: 'Access token is required for private files' };
    }

    if (token.length < 20) {
      return { valid: false, message: 'Token too short (minimum 20 characters)' };
    }

    if (token.length > 200) {
      return { valid: false, message: 'Token too long (maximum 200 characters)' };
    }

    // Check for common token patterns
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      return { valid: false, message: 'Token contains invalid characters' };
    }

    return { valid: true };
  }, []);

  // Fixed debounced validation with proper dependencies and cleanup
  const [validateInputs, cleanupValidation] = useMemo(() => {
    return debounce((url: string, token: string) => {
      const urlValidation = validateFigmaUrl(url);
      const tokenValidation = validateAccessToken(token);

      setValidationState({
        isFigmaUrlValid: urlValidation.valid,
        isAccessTokenValid: tokenValidation.valid,
        urlValidationMessage: urlValidation.message,
        tokenValidationMessage: tokenValidation.message,
      });
    }, 300);
  }, [validateFigmaUrl, validateAccessToken]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return cleanupValidation;
  }, [cleanupValidation]);

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
  }, [actions, validationState]);

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

  // Connection quality indicator
  const getConnectionQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Enhanced Figma data display with metrics
  const figmaDataDisplay = useMemo(() => {
    if (!isSuccess || !stepData.figmaData) return null;

    const { figmaData } = stepData;
    const { responseTime, connectionQuality } = connectionStatus;

    return (
      <div className="mt-4 transition-all duration-300 ease-in-out">
        {/* Connection Success Header */}
        <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-600 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Successfully Connected</span>
          </div>
          <div className="flex items-center gap-2">
            {responseTime && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {responseTime}ms
              </Badge>
            )}
            {connectionQuality && (
              <Badge variant="outline" className={`text-xs ${getConnectionQualityColor(connectionQuality)}`}>
                <Globe className="w-3 h-3 mr-1" />
                {connectionQuality}
              </Badge>
            )}
          </div>
        </div>

        {/* File Information Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Components</span>
            </div>
            <div className="text-lg font-bold text-white">
              {figmaData.metadata?.componentCount || 0}
            </div>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Styles</span>
            </div>
            <div className="text-lg font-bold text-white">
              {figmaData.metadata?.styleCount || 0}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => actions.toggleBlock('block1')}
          className="text-green-400 hover:bg-gray-700 w-full justify-between"
          aria-expanded={uiState.expandedBlocks.block1}
          aria-controls="figma-data-panel"
        >
          <span>📊 View Detailed Information</span>
          {uiState.expandedBlocks.block1 ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {uiState.expandedBlocks.block1 && (
          <div
            id="figma-data-panel"
            className="mt-3 p-4 bg-gray-700 rounded-lg text-sm text-gray-300 max-h-60 overflow-y-auto"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="text-white">File Name:</strong>
                  <div className="text-gray-300">{figmaData.file?.name || 'N/A'}</div>
                </div>
                <div>
                  <strong className="text-white">Last Modified:</strong>
                  <div className="text-gray-300">
                    {figmaData.file?.last_modified 
                      ? new Date(figmaData.file.last_modified).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
              
              <Separator className="bg-gray-600" />
              
              <div>
                <strong className="text-white">Connection Metrics:</strong>
                <div className="mt-2 space-y-1 text-xs">
                  <div>Response Time: {responseTime}ms</div>
                  <div>Quality: {connectionQuality}</div>
                  <div>Retry Count: {connectionMetrics.retryCount}</div>
                  <div>Connected At: {connectionStatus.lastConnected?.toLocaleTimeString()}</div>
                </div>
              </div>
              
              <Separator className="bg-gray-600" />
              
              <div>
                <strong className="text-white">Raw Metadata:</strong>
                <pre className="mt-2 text-xs overflow-x-auto bg-gray-800 p-2 rounded">
                  {JSON.stringify(figmaData.metadata, null, 2).slice(0, 800)}
                  {JSON.stringify(figmaData.metadata, null, 2).length > 800 && '...'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [isSuccess, stepData.figmaData, uiState.expandedBlocks.block1, actions, connectionStatus, connectionMetrics]);

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
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-400">Connecting to Figma...</span>
              <span className="text-gray-400">
                {connectionMetrics.retryCount > 1 && `Attempt ${connectionMetrics.retryCount}`}
              </span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 text-sm font-medium" htmlFor="figma-url">
              Figma URL *
            </Label>
            <div className="relative mt-1">
              <Link className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="figma-url"
                value={formState.figmaUrl}
                onChange={handleInputChange('figmaUrl')}
                className={`bg-gray-700 border-gray-600 text-white pl-10 transition-colors ${
                  !validationState.isFigmaUrlValid && formState.figmaUrl 
                    ? 'border-red-500 focus:border-red-400' 
                    : validationState.isFigmaUrlValid && formState.figmaUrl
                    ? 'border-green-500 focus:border-green-400'
                    : ''
                }`}
                placeholder="https://www.figma.com/design/..."
                disabled={isLoading}
                aria-invalid={!validationState.isFigmaUrlValid}
                aria-describedby="figma-url-help"
              />
            </div>
            {validationState.urlValidationMessage && formState.figmaUrl && (
              <p className={`text-xs mt-1 ${
                validationState.isFigmaUrlValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validationState.urlValidationMessage}
              </p>
            )}
            <p id="figma-url-help" className="text-xs text-gray-500 mt-1">
              Supports file, design, and prototype URLs
            </p>
          </div>

          <div>
            <Label className="text-gray-300 text-sm font-medium" htmlFor="access-token">
              Personal Access Token
            </Label>
            <div className="relative mt-1">
              <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="access-token"
                type="password"
                value={formState.accessToken}
                onChange={handleInputChange('accessToken')}
                className={`bg-gray-700 border-gray-600 text-white pl-10 transition-colors ${
                  !validationState.isAccessTokenValid && formState.accessToken 
                    ? 'border-red-500 focus:border-red-400' 
                    : validationState.isAccessTokenValid && formState.accessToken
                    ? 'border-green-500 focus:border-green-400'
                    : ''
                }`}
                placeholder="figd_••••••••••••••••••••••••••••••••"
                disabled={isLoading}
                aria-invalid={!validationState.isAccessTokenValid}
                aria-describedby="access-token-help"
              />
            </div>
            {validationState.tokenValidationMessage && formState.accessToken && (
              <p className={`text-xs mt-1 ${
                validationState.isAccessTokenValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validationState.tokenValidationMessage}
              </p>
            )}
            <p id="access-token-help" className="text-xs text-gray-500 mt-1">
              Required for private files. Generate at{' '}
              <a 
                href="https://www.figma.com/developers/api#access-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                figma.com/developers
              </a>
            </p>
          </div>
        </div>

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
        {isSuccess && stepData.figmaData && (
          <div className="mt-4 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-600 rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Successfully Connected</span>
              </div>
              <div className="flex items-center gap-2">
                {connectionStatus.responseTime && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {connectionStatus.responseTime}ms
                  </Badge>
                )}
                {connectionStatus.connectionQuality && (
                  <Badge variant="outline" className={`text-xs ${
                    connectionStatus.connectionQuality === 'excellent' ? 'text-green-400' :
                    connectionStatus.connectionQuality === 'good' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    <Globe className="w-3 h-3 mr-1" />
                    {connectionStatus.connectionQuality}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Components</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {stepData.figmaData.metadata?.componentCount || 0}
                </div>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Styles</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {stepData.figmaData.metadata?.styleCount || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
