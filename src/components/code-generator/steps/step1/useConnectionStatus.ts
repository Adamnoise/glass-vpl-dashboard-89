
import { useState } from 'react';
import { FigmaConnectionStatus, ConnectionMetrics } from './types';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<FigmaConnectionStatus>({
    isConnected: false,
    isConnecting: false,
  });
  
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    startTime: 0,
    retryCount: 0,
  });

  return {
    connectionStatus,
    setConnectionStatus,
    connectionMetrics,
    setConnectionMetrics
  };
};
