'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useBaseTrading } from './use-base-trading';

export interface UpDownAssetMetrics {
  history: number[];
  timeHistory: number[];
  lastDirection: number;
  currentStreak: number;
  globalTickCounter: number;
  isPendingDelay: boolean;
  delayExpiryTick: number;
  delayDirection: number;
  counts: {
    3: { up: number; down: number };
    4: { up: number; down: number };
    5: { up: number; down: number };
  };
}

export function useRiseFallTrading({ ws, isConnected, isExhausted, isAuthenticated, onAuthWSFailed }: any) {
  // Leverage the native data clearinghouse stream from the goldrush template repository
  const {
    ws: tradingWs,
    isConnected: tradingIsConnected,
    symbols,
  } = useBaseTrading({ ws, isConnected, isExhausted, isAuthenticated, onAuthWSFailed, contractTypes: ['CALL', 'PUT'] });

  const [selectedAsset, setSelectedAsset] = useState<string>('R_10');
  const [targetTickConfig, setTargetTickCondition] = useState<number>(5);
  const [globalStake, setGlobalStake] = useState<number>(0.35); // Enforced strict default stake context
  const [executionMode, setExecutionMode] = useState<'manual' | 'dynamic'>('manual');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  // Persistent reference matrix for parallel background track computation loops
  const metricsRef = useRef<Record<string, UpDownAssetMetrics>>({
    'R_10': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    'R_25': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    'R_50': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    'R_100': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    '1HZ10V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    '1HZ25V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    '1HZ50V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } },
    '1HZ100V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } } }
  });

  const addLog = useCallback((line: string) => {
    setSimulationLogs(prev => [line, ...prev].slice(0, 400));
  }, []);

  const executeOrderPayload = useCallback((symbol: string, direction: 'CALL' | 'PUT') => {
    if (!tradingWs || tradingWs.readyState !== WebSocket.OPEN) return;

    const timestamp = new Date().toLocaleTimeString();
    tradingWs.send(JSON.stringify({
      proposal: 1,
      amount: globalStake,
      basis: 'stake',
      contract_type: direction, // Direct institutional mapping variables passed to official server
      currency: 'USD',
      duration: targetTickConfig,
      duration_unit: 't',
      symbol: symbol
    }));

    addLog(`[${timestamp}] PIPELINE DISPATCHED -> ${symbol} │ TYPE: ${direction} │ UNITS: $${globalStake}`);
  }, [tradingWs, globalStake, targetTickConfig, addLog]);

  useEffect(() => {
    if (!tradingWs || !tradingIsConnected) return;

    const unbind = tradingWs.onMessage((event: any) => {
      const packet = JSON.parse(event.data || event);
      if (packet.error) return;

      if (packet.msg_type === 'tick' && packet.tick) {
        const symbol = packet.tick.symbol;
        const state = metricsRef.current[symbol];
        if (!state) return;

        const quote = Number(packet.tick.quote);
        const now = Date.now();

        state.globalTickCounter++;
        state.history.push(quote);
        state.timeHistory.push(now);
        if (state.history.length > 200) { state.history.shift(); state.timeHistory.shift(); }

        if (state.history.length < 2) return;
        const delta = quote - state.history[state.history.length - 2];
        const direction = delta > 0 ? 1 : delta < 0 ? -1 : 0;

        if (direction !== 0 && direction === state.lastDirection) {
          state.currentStreak++;
          if (state.currentStreak === 3) state.counts[3][direction === 1 ? 'up' : 'down']++;
          if (state.currentStreak === 4) state.counts[4][direction === 1 ? 'up' : 'down']++;
          if (state.currentStreak === 5) state.counts[5][direction === 1 ? 'up' : 'down']++;

          // DYNAMIC MODE ENGINE: Dispatches raw CALL/PUT contract strings automatically if configuration boundaries match
          if (executionMode === 'dynamic' && state.currentStreak === targetTickConfig) {
            executeOrderPayload(symbol, direction === 1 ? 'CALL' : 'PUT');
          }
        } else {
          state.lastDirection = direction;
          state.currentStreak = 1;
        }
      }

      if (packet.msg_type === 'buy' && packet.buy) {
        addLog(`[${new Date().toLocaleTimeString()}] SERVER RECEIPT ACCEPTED. CONTRACT ID: ${packet.buy.contract_id}`);
      }
    });

    return () => unbind();
  }, [tradingWs, tradingIsConnected, executionMode, targetTickConfig, executeOrderPayload, addLog]);

  return {
    ws: tradingWs, isConnected: tradingIsConnected, symbols, selectedAsset, setSelectedAsset,
    globalStake, setGlobalStake, targetTickConfig, setTargetTickCondition, executionMode, setExecutionMode,
    simulationLogs, activeMetrics: metricsRef.current[selectedAsset], allMetrics: metricsRef.current, executeOrderPayload
  };
}