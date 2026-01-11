/**
 * useKateBridge - React hook for Kate WebSocket bridge communication
 * 
 * Provides real-time communication with the Kate engine backend bridge
 * for syntax highlighting, code folding, and buffer synchronization.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SyntaxToken, FoldingRegion } from '../../../shared/kate-types';

interface KateBridgeStatus {
  connected: boolean;
  kateAvailable: boolean;
  version?: string;
}

interface KateBridgeMessage {
  type: string;
  payload?: any;
  message?: string;
}

interface UseKateBridgeOptions {
  onConnected?: (status: KateBridgeStatus) => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
}

export function useKateBridge(options: UseKateBridgeOptions = {}) {
  const [status, setStatus] = useState<KateBridgeStatus>({
    connected: false,
    kateAvailable: false,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000;
  
  // Memoize callbacks to prevent unnecessary reconnections
  const { onConnected, onDisconnected, onError } = options;

  const connect = useCallback(() => {
    // Determine WebSocket URL (use same host as current page)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/kate`;

    console.log('[useKateBridge] Connecting to Kate bridge:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[useKateBridge] Connected to Kate bridge');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message: KateBridgeMessage = JSON.parse(event.data);
        
        if (message.type === 'connected') {
          const newStatus: KateBridgeStatus = {
            connected: true,
            kateAvailable: message.payload?.kateAvailable || false,
            version: message.payload?.version,
          };
          setStatus(newStatus);
          onConnected?.(newStatus);
          console.log('[useKateBridge] Kate status:', newStatus);
        }
      } catch (error) {
        console.error('[useKateBridge] Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[useKateBridge] WebSocket error:', error);
      onError?.('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('[useKateBridge] Disconnected from Kate bridge');
      setStatus({ connected: false, kateAvailable: false });
      onDisconnected?.();

      // Attempt to reconnect
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        console.log(
          `[useKateBridge] Reconnecting (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`
        );
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
      } else {
        console.error('[useKateBridge] Max reconnection attempts reached');
        onError?.('Unable to connect to Kate bridge');
      }
    };
  }, [onConnected, onDisconnected, onError]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: KateBridgeMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[useKateBridge] Cannot send message, WebSocket not open');
    }
  }, []);

  const openDocument = useCallback(
    (documentId: string, filePath: string, content: string, language: string) => {
      send({
        type: 'buffer.open',
        payload: { documentId, filePath, content, language },
      });
    },
    [send]
  );

  const closeDocument = useCallback(
    (documentId: string) => {
      send({
        type: 'buffer.close',
        payload: { documentId },
      });
    },
    [send]
  );

  const requestSyntaxHighlighting = useCallback(
    (documentId: string, lineStart: number, lineEnd: number): Promise<SyntaxToken[]> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }

        const handler = (event: MessageEvent) => {
          try {
            const message: KateBridgeMessage = JSON.parse(event.data);
            if (message.type === 'syntax.response') {
              // Remove handler regardless of which document it was for
              wsRef.current?.removeEventListener('message', handler);
              
              if (message.payload?.documentId === documentId) {
                resolve(message.payload.tokens || []);
              } else {
                reject(new Error('Response for different document'));
              }
            }
          } catch (error) {
            wsRef.current?.removeEventListener('message', handler);
            reject(error);
          }
        };

        wsRef.current.addEventListener('message', handler);
        
        send({
          type: 'syntax.request',
          payload: { documentId, lineStart, lineEnd },
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          wsRef.current?.removeEventListener('message', handler);
          reject(new Error('Syntax highlighting request timeout'));
        }, 5000);
      });
    },
    [send]
  );

  const requestFoldingRegions = useCallback(
    (documentId: string): Promise<FoldingRegion[]> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }

        const handler = (event: MessageEvent) => {
          try {
            const message: KateBridgeMessage = JSON.parse(event.data);
            if (message.type === 'fold.response') {
              // Remove handler regardless of which document it was for
              wsRef.current?.removeEventListener('message', handler);
              
              if (message.payload?.documentId === documentId) {
                resolve(message.payload.regions || []);
              } else {
                reject(new Error('Response for different document'));
              }
            }
          } catch (error) {
            wsRef.current?.removeEventListener('message', handler);
            reject(error);
          }
        };

        wsRef.current.addEventListener('message', handler);
        
        send({
          type: 'fold.request',
          payload: { documentId },
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          wsRef.current?.removeEventListener('message', handler);
          reject(new Error('Folding regions request timeout'));
        }, 5000);
      });
    },
    [send]
  );

  return {
    status,
    openDocument,
    closeDocument,
    requestSyntaxHighlighting,
    requestFoldingRegions,
  };
}
