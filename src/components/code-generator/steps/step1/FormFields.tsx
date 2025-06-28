
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, Shield } from 'lucide-react';
import { FormState, ValidationState } from './types';

interface FormFieldsProps {
  formState: FormState;
  validationState: ValidationState;
  isLoading: boolean;
  onInputChange: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormFields: React.FC<FormFieldsProps> = ({
  formState,
  validationState,
  isLoading,
  onInputChange
}) => {
  return (
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
            onChange={onInputChange('figmaUrl')}
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
            onChange={onInputChange('accessToken')}
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
  );
};
