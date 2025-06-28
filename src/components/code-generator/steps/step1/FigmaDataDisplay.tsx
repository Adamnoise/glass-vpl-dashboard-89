
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Shield,
  Globe,
  Clock,
  Database
} from 'lucide-react';
import { FigmaConnectionStatus, ConnectionMetrics } from './types';
import { getConnectionQualityColor } from './utils';

interface FigmaDataDisplayProps {
  isSuccess: boolean;
  figmaData: any;
  connectionStatus: FigmaConnectionStatus;
  connectionMetrics: ConnectionMetrics;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const FigmaDataDisplay: React.FC<FigmaDataDisplayProps> = ({
  isSuccess,
  figmaData,
  connectionStatus,
  connectionMetrics,
  isExpanded,
  onToggleExpanded
}) => {
  if (!isSuccess || !figmaData) return null;

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
        onClick={onToggleExpanded}
        className="text-green-400 hover:bg-gray-700 w-full justify-between"
        aria-expanded={isExpanded}
        aria-controls="figma-data-panel"
      >
        <span>📊 View Detailed Information</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isExpanded && (
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
};
