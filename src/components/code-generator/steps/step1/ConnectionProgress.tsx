
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ConnectionMetrics } from './types';

interface ConnectionProgressProps {
  isLoading: boolean;
  connectionMetrics: ConnectionMetrics;
}

export const ConnectionProgress: React.FC<ConnectionProgressProps> = ({
  isLoading,
  connectionMetrics
}) => {
  if (!isLoading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-blue-400">Connecting to Figma...</span>
        <span className="text-gray-400">
          {connectionMetrics.retryCount > 1 && `Attempt ${connectionMetrics.retryCount}`}
        </span>
      </div>
      <Progress value={undefined} className="h-2" />
    </div>
  );
};
