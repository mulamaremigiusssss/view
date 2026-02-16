import { useEffect, useRef, useState, useCallback } from 'react';
import { getPoll } from '../utils/api';

const WS_URL = 'wss://view-ezh5.onrender.com';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const POLLING_FALLBACK_INTERVAL = 3000;

export function useWebSocket(pollId) {
  const [results, setResults] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnect = useRef(true);
  const pollingIntervalRef = useRef(null);
  const hasReceivedWSUpdate = useRef(false);

  const startPolling = useCallback(() => {
    console.log(' Starting polling fallback...');
    
    const poll = async () => {
      try {
        const data = await getPoll(pollId);
        setResults(data.poll);
        console.log('Polling update:', data.poll.totalVotes, 'votes');
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    
    pollingIntervalRef.current = setInterval(poll, POLLING_FALLBACK_INTERVAL);
  }, [pollId]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹ Stopping polling fallback');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!pollId || !shouldReconnect.current) return;

    try {
      console.log(' Connecting to WebSocket:', `${WS_URL}?pollId=${pollId}`);
      const ws = new WebSocket(`${WS_URL}?pollId=${pollId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        stopPolling(); 
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(' WebSocket message received:', data);
          
          if (data.type === 'results') {
            hasReceivedWSUpdate.current = true;
            setResults(data.poll);
            console.log(' Real-time update received:', data.poll.totalVotes, 'votes');
          } else if (data.type === 'poll_update') {
            hasReceivedWSUpdate.current = true;
            setResults(data.poll);
            console.log(' Poll update received:', data.poll.totalVotes, 'votes');
          } else {
            console.log('ℹ Unknown message type:', data.type);
          }
        } catch (error) {
          console.error(' Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(' WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log(' WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (shouldReconnect.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          console.log(`🔄 Reconnecting... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error(' Max reconnection attempts reached. Switching to polling.');
          startPolling(); 
        }
      };

      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          if (!hasReceivedWSUpdate.current) {
            startPolling();
          }
        }
      }, 5000);

    } catch (error) {
      console.error(' Failed to create WebSocket:', error);
      startPolling();
    }
  }, [pollId, startPolling, stopPolling]);

  useEffect(() => {
    shouldReconnect.current = true;
    hasReceivedWSUpdate.current = false;
    connect();

    return () => {
      shouldReconnect.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      stopPolling();
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connect, stopPolling]);

  return { results, isConnected };
}