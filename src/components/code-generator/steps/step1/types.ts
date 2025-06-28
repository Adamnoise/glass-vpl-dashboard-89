
export interface FormState {
  figmaUrl: string;
  accessToken: string;
}

export interface ValidationState {
  isFigmaUrlValid: boolean;
  isAccessTokenValid: boolean;
  urlValidationMessage?: string;
  tokenValidationMessage?: string;
}

export interface FigmaConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  connectionQuality?: 'excellent' | 'good' | 'poor';
  responseTime?: number;
  error?: string;
}

export interface ConnectionMetrics {
  startTime: number;
  endTime?: number;
  responseTime?: number;
  dataSize?: number;
  retryCount: number;
}
