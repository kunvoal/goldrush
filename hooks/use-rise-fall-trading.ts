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
  const baseTrading = useBaseTrading({ 
    ws, 
    isConnected, 
    isExhausted, 
    isAuthenticated, 
    onAuthWSFailed, 
    contractTypes: ['CALL', 'PUT'] 
  });

  const [direction, setDirection] = useState<string>('CALL');
  const [allowEquals, setAllowEquals] = useState<boolean>(false);
  const [stake, setStake] = useState<string>('0.35'); 
  const [duration, setDuration] = useState<number>(5); 
  const [durationUnit, setDurationUnit] = useState<string>('t');
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [buyResult, setBuyResult] = useState<any>(null);
  const [buyError, setBuyError] = useState<any>(null);
  const [sellingId, setSellingId] = useState<any>(null);

  const [selectedAsset, setSelectedAsset] = useState<string>('R_10');
  const [executionMode, setExecutionMode] = useState<'manual' | 'dynamic'>('manual');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

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
    setSimulationLogs(prev => [line, ...prev].slice(0, 300));
  }, []);

  const executeOrderPayload = useCallback((symbol: string, orderDirection: 'CALL' | 'PUT') => {
    if (!baseTrading.ws || baseTrading.ws.readyState !== WebSocket.OPEN) return;

    const timestamp = new Date().toLocaleTimeString();
    baseTrading.ws.send(JSON.stringify({
      proposal: 1,
      amount: parseFloat(stake) || 0.35,
      basis: 'stake',
      contract_type: orderDirection,
      currency: 'USD',
      duration: duration,
      duration_unit: durationUnit,
      symbol: symbol
    }));

    addLog(`[${timestamp}] Outbound: ${symbol} │ ${orderDirection} │ $${stake}`);
  }, [baseTrading.ws, stake, duration, durationUnit, addLog]);

  const buyContract = useCallback(async () => {
    executeOrderPayload(selectedAsset, direction as 'CALL' | 'PUT');
  }, [executeOrderPayload, selectedAsset, direction]);

  const clearBuyResult = useCallback(() => {
    setBuyResult(null);
    setBuyError(null);
  }, []);

  const sellContract = useCallback(async (contractId: number, bidPrice: string) => {
    if (baseTrading.ws) {
      baseTrading.ws.send(JSON.stringify({ sell: contractId, price: parseFloat(bidPrice) }));
    }
  }, [baseTrading.ws]);

  useEffect(() => {
    if (!baseTrading.ws || !baseTrading.isConnected) return;

    const unbind = baseTrading.ws.onMessage((packet: Record<string, unknown>) => {
      if (packet.error) return;

      if (packet.msg_type === 'tick' && packet.tick) {
        const tick = packet.tick as Record<string, unknown>;
        const symbol = tick.symbol as string;
        const state = metricsRef.current[symbol];
        if (!state) return;

        const quote = Number(tick.quote);
        const now = Date.now();

        state.globalTickCounter++;
        state.history.push(quote);
        state.timeHistory.push(now);
        if (state.history.length > 200) { state.history.shift(); state.timeHistory.shift(); }

        if (state.history.length < 2) return;
        const delta = quote - state.history[state.history.length - 2];
        const currentDirection = delta > 0 ? 1 : delta < 0 ? -1 : 0;

        if (currentDirection !== 0 && currentDirection === state.lastDirection) {
          state.currentStreak++;
          if (state.currentStreak === 3) state.counts[3][currentDirection === 1 ? 'up' : 'down']++;
          if (state.currentStreak === 4) state.counts[4][currentDirection === 1 ? 'up' : 'down']++;
          if (state.currentStreak === 5) state.counts[5][currentDirection === 1 ? 'up' : 'down']++;

          if (executionMode === 'dynamic' && state.currentStreak === duration) {
            executeOrderPayload(symbol, currentDirection === 1 ? 'CALL' : 'PUT');
          }
        } else {
          state.lastDirection = currentDirection;
          state.currentStreak = 1;
        }
      }

      if (packet.msg_type === 'buy' && packet.buy) {
        const buy = packet.buy as Record<string, unknown>;
        addLog(`[${new Date().toLocaleTimeString()}] Server Receipt: ${buy.contract_id}`);
      }
    });

    const assetKeys = Object.keys(metricsRef.current);
    assetKeys.forEach(asset => {
      baseTrading.ws.send(JSON.stringify({ ticks: asset }));
    });

    return () => unbind();
  }, [baseTrading.ws, baseTrading.isConnected, executionMode, duration, executeOrderPayload, addLog]);

  return {
    ...baseTrading,
    direction, setDirection, allowEquals, setAllowEquals, stake, setStake, duration, setDuration,
    durationOptions: [] as any[], durationUnit, setDurationUnit, endDate: undefined, setEndDate: () => {},
    endTime: '', setEndTime: () => {}, proposal: null, buyContract, isBuying, buyResult, buyError,
    clearBuyResult, openPositions: [] as any[], sellContract, sellingId, selectedAsset, setSelectedAsset,
    executionMode, setExecutionMode, simulationLogs, activeMetrics: metricsRef.current[selectedAsset],
    allMetrics: metricsRef.current, executeOrderPayload
  };
}