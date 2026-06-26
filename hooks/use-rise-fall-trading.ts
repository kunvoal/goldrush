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
  lastRunTick: Record<number, number>;
  gapSums: Record<number, number>;
  runCounts: Record<number, number>;
  avgGaps: Record<number, number>;
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
  const [tickTrigger, setTickTrigger] = useState<number>(0);

  const metricsRef = useRef<Record<string, UpDownAssetMetrics>>({
    'R_10': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    'R_25': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    'R_50': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    'R_100': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    '1HZ10V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    '1HZ25V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    '1HZ50V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } },
    '1HZ100V': { history: [], timeHistory: [], lastDirection: 0, currentStreak: 0, globalTickCounter: 0, isPendingDelay: false, delayExpiryTick: 0, delayDirection: 0, counts: { 3: { up: 0, down: 0 }, 4: { up: 0, down: 0 }, 5: { up: 0, down: 0 } }, lastRunTick: { 3: 0, 4: 0, 5: 0 }, gapSums: { 3: 0, 4: 0, 5: 0 }, runCounts: { 3: 0, 4: 0, 5: 0 }, avgGaps: { 3: 0, 4: 0, 5: 0 } }
  });

  const addLog = useCallback((line: string) => {
    setSimulationLogs(prev => [line, ...prev].slice(0, 300));
  }, []);

  // Fetch balance function
  const fetchBalance = useCallback(() => {
    if (baseTrading.ws && baseTrading.isConnected) {
      baseTrading.ws.send({ balance: 1, subscribe: 1 }).catch(() => {});
    }
  }, [baseTrading.ws, baseTrading.isConnected]);

  // Initial balance fetch on connect
  useEffect(() => {
    if (baseTrading.isConnected) {
      fetchBalance();
    }
  }, [baseTrading.isConnected, fetchBalance]);

  const executeOrderPayload = useCallback((symbol: string, orderDirection: 'CALL' | 'PUT') => {
    if (!baseTrading.ws || !baseTrading.isConnected) return;

    const timestamp = new Date().toLocaleTimeString();
    baseTrading.ws.send({
      proposal: 1,
      amount: parseFloat(stake) || 0.35,
      basis: 'stake',
      contract_type: orderDirection,
      currency: 'USD',
      duration: duration,
      duration_unit: durationUnit,
      symbol: symbol
    }).catch(() => {});

    addLog(`[${timestamp}] Outbound: ${symbol} │ ${orderDirection} │ $${stake}`);
  }, [baseTrading.ws, baseTrading.isConnected, stake, duration, durationUnit, addLog]);

  const buyContract = useCallback(async () => {
    executeOrderPayload(selectedAsset, direction as 'CALL' | 'PUT');
  }, [executeOrderPayload, selectedAsset, direction]);

  const clearBuyResult = useCallback(() => {
    setBuyResult(null);
    setBuyError(null);
  }, []);

  const sellContract = useCallback(async (contractId: number, bidPrice: string) => {
    if (baseTrading.ws) {
      baseTrading.ws.send({ sell: contractId, price: parseFloat(bidPrice) }).catch(() => {});
    }
  }, [baseTrading.ws]);

  // Keep unstable callback dependencies in a stable ref to prevent tick re-subscriptions
  const callbackRefs = useRef({
    executionMode,
    duration,
    executeOrderPayload,
    addLog,
    fetchBalance,
  });

  useEffect(() => {
    callbackRefs.current = {
      executionMode,
      duration,
      executeOrderPayload,
      addLog,
      fetchBalance,
    };
  });

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
        const newHistory = [...state.history, quote];
        const newTimeHistory = [...state.timeHistory, now];
        if (newHistory.length > 200) { newHistory.shift(); newTimeHistory.shift(); }
        state.history = newHistory;
        state.timeHistory = newTimeHistory;

        if (state.history.length < 2) return;
        const delta = quote - state.history[state.history.length - 2];
        const currentDirection = delta > 0 ? 1 : delta < 0 ? -1 : 0;

        if (currentDirection !== 0 && currentDirection === state.lastDirection) {
          state.currentStreak++;
          
          const registerRun = (L: number) => {
            state.counts[L as 3|4|5][currentDirection === 1 ? 'up' : 'down']++;
            
            const currentTickCount = state.globalTickCounter;
            const lastTickForL = state.lastRunTick[L] || 0;
            if (lastTickForL > 0) {
              const gap = currentTickCount - lastTickForL;
              state.gapSums[L] += gap;
              state.runCounts[L]++;
              state.avgGaps[L] = Math.round(state.gapSums[L] / state.runCounts[L]);
            } else {
              state.runCounts[L] = 1;
            }
            state.lastRunTick[L] = currentTickCount;
          };

          if (state.currentStreak === 3) registerRun(3);
          if (state.currentStreak === 4) registerRun(4);
          if (state.currentStreak === 5) registerRun(5);

          const refs = callbackRefs.current;
          if (refs.executionMode === 'dynamic' && state.currentStreak === refs.duration) {
            refs.executeOrderPayload(symbol, currentDirection === 1 ? 'CALL' : 'PUT');
          }
        } else {
          state.lastDirection = currentDirection;
          state.currentStreak = 1;
        }

        setTickTrigger(prev => prev + 1);
      }

      if (packet.msg_type === 'buy' && packet.buy) {
        const buy = packet.buy as Record<string, unknown>;
        callbackRefs.current.addLog(`[${new Date().toLocaleTimeString()}] Server Receipt: ${buy.contract_id}`);
        // Fetch updated balance after purchase
        callbackRefs.current.fetchBalance();
      }
      
      if (packet.msg_type === 'balance' && packet.balance) {
         // This updates the base hooks balance if needed, though DerivWS usually triggers it
         // but this ensures we catch subscribe updates
      }
    });

    // Unsubscribe from previous before subscribing to all assets (prevents duplicate streams)
    if (baseTrading.ws) {
      const ws = baseTrading.ws;
      ws.send({ forget_all: 'ticks' }).catch(() => {}).then(() => {
        const ALL_ASSETS = ['R_10', 'R_25', 'R_50', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ100V'];
        ALL_ASSETS.forEach(asset => {
          ws.send({ ticks: asset, subscribe: 1 }).catch(() => {});
        });
      });
    }

    return () => unbind();
  }, [baseTrading.ws, baseTrading.isConnected]);

  return {
    ...baseTrading,
    direction, setDirection, allowEquals, setAllowEquals, stake, setStake, duration, setDuration,
    durationOptions: [] as any[], durationUnit, setDurationUnit, endDate: undefined, setEndDate: () => {},
    endTime: '', setEndTime: () => {}, proposal: null, buyContract, isBuying, buyResult, buyError,
    clearBuyResult, openPositions: [] as any[], sellContract, sellingId, selectedAsset, setSelectedAsset,
    executionMode, setExecutionMode, simulationLogs, activeMetrics: metricsRef.current[selectedAsset],
    allMetrics: metricsRef.current, executeOrderPayload, tickTrigger
  };
}