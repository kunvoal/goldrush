'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/custom/header';
import { Footer } from '@/components/custom/footer';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { TickCanvasChart } from './tick-canvas-chart';

interface DropdownOption {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: any) => void;
  label?: string;
  width?: string;
}

function CustomDropdown({ options, value, onChange, label, width = 'w-auto' }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${width} font-mono select-none`} style={{ zIndex: 60 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-[#020204] border border-[#16161f] hover:border-white/20 px-2.5 py-1 rounded h-[32px] cursor-pointer text-xs font-bold text-white transition"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {label && <span className="text-[9px] text-[#444b55] uppercase tracking-wider mr-1">{label}</span>}
          <span className="truncate">{selectedOption?.label || value}</span>
        </div>
        <span className="text-[8px] text-white/40 ml-1.5 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-full bg-[#020204] border border-[#16161f] rounded shadow-2xl overflow-hidden py-0.5" style={{ zIndex: 100 }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-2.5 py-1.5 text-xs font-bold cursor-pointer transition ${opt.value === value ? 'bg-[#facc15] text-black' : 'text-white hover:bg-[#161622]'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface RiseFallViewProps {
  authState: any;
  accounts: any[];
  activeAccount: any;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  trading: any;
  [key: string]: any;
}


export function RiseFallView({
  authState, accounts, activeAccount, onLogin, onSignUp, onLogout, onSwitchAccount, trading,
  logoSrc, appName, chartData, getQuotes, subscribeQuotes, unsubscribeQuotes
}: RiseFallViewProps) {
  const [showStats, setShowStats] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('0:00');

  useEffect(() => {
    const start = Date.now();
    const update = () => {
      const diffMs = Date.now() - start;
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const formattedMins = String(diffMins).padStart(2, '0');
      setElapsedTime(`${diffHrs}:${formattedMins}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const assetOptions = [
    { value: 'R_10', label: 'Vol 10' },
    { value: 'R_25', label: 'Vol 25' },
    { value: 'R_50', label: 'Vol 50' },
    { value: 'R_100', label: 'Vol 100' },
    { value: '1HZ10V', label: 'Vol 10 (1s)' },
    { value: '1HZ25V', label: 'Vol 25 (1s)' },
    { value: '1HZ50V', label: 'Vol 50 (1s)' },
    { value: '1HZ100V', label: 'Vol 100 (1s)' },
  ];

  const tickOptions = [
    { value: 5, label: '5' },
    { value: 4, label: '4' },
    { value: 3, label: '3' },
  ];

  return (
    <main className="flex flex-col bg-[#050507] text-[#c9ced6] min-h-screen font-mono antialiased select-none relative">
      <Header
        authState={authState} accounts={accounts} activeAccount={activeAccount}
        onLogin={onLogin} onSignUp={onSignUp} onLogout={onLogout} onSwitchAccount={onSwitchAccount}
        logoSrc={logoSrc} appName={appName}
        actions={
          <div className="flex items-center gap-3">
            {/* Volatility select dropdown */}
            <CustomDropdown
              options={assetOptions}
              value={trading.selectedAsset}
              onChange={(val) => trading.setSelectedAsset(val)}
              width="w-[125px]"
            />

            {/* Stake Input */}
            <div className="flex items-center bg-[#020204] border border-[#16161f] px-2 py-1 rounded h-[32px]" style={{ width: '3cm' }}>
              <input 
                type="text" inputMode="decimal" placeholder="0.35"
                className="bg-transparent font-bold text-xs text-[#facc15] placeholder:text-[#facc15]/40 text-center outline-none border-none w-full p-0"
                value={trading.stake} onChange={(e) => trading.setStake(e.target.value)}
              />
            </div>

            {/* Ticks Duration Input */}
            <div className="flex items-center bg-[#020204] border border-[#16161f] px-2.5 py-1 rounded h-[32px]" style={{ width: '3cm' }}>
              <span className="text-[9px] text-[#444b55] font-bold uppercase mr-1 select-none">Ticks:</span>
              <input 
                type="text" inputMode="numeric"
                className="bg-transparent font-bold text-xs text-[#ffffff] text-center outline-none border-none w-full p-0"
                value={trading.duration} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    trading.setDuration('');
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    if (num >= 3 && num <= 5) {
                      trading.setDuration(num);
                    }
                  }
                }}
                onBlur={() => {
                  const num = parseInt(String(trading.duration), 10);
                  if (isNaN(num) || num < 3 || num > 5) {
                    trading.setDuration(5);
                  }
                }}
              />
            </div>

            {/* Mode Switch (Manual vs Dynamic) */}
            <div className="flex items-center gap-1.5 bg-[#020204] border border-[#16161f] px-2 py-1 rounded h-[32px]">
              <span className="text-[9px] text-[#444b55] font-bold uppercase mr-1">MODE:</span>
              <button
                onClick={() => trading.setExecutionMode(trading.executionMode === 'manual' ? 'dynamic' : 'manual')}
                className="relative inline-flex h-4 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out border border-transparent focus-visible:outline-none"
                style={{ backgroundColor: trading.executionMode === 'dynamic' ? '#ec4899' : '#1e293b' }}
              >
                <span
                  className="pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out"
                  style={{ transform: trading.executionMode === 'dynamic' ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
              <span className={`text-[9px] font-bold uppercase ${trading.executionMode === 'dynamic' ? 'text-[#ec4899]' : 'text-[#facc15]'}`}>
                {trading.executionMode}
              </span>
            </div>

            {/* Elapsed Time Counter */}
            <div className="text-[10px] font-bold text-white/60 bg-[#020204] border border-[#16161f] px-2 py-1 rounded h-[32px] flex items-center justify-center select-none font-mono">
              {elapsedTime}
            </div>

            {/* Stats Window Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition select-none h-[32px] flex items-center ${showStats ? 'bg-[#facc15] text-[#000] border-[#facc15]' : 'text-[#facc15] border-[#facc15]/30 hover:bg-[#facc15]/10'}`}
            >
              Stats
            </button>

            <ThemeToggle />
          </div>
        }
      />
      <div className="h-[64px] shrink-0" />

      {/* CHARTS LAYER SECTION CONTAINER (Edge-to-Edge, no margins) */}
      <div className="w-full bg-[#0a0a0d] border-b border-[#16161f] p-0 flex flex-col min-h-[260px] relative overflow-hidden">
        <TickCanvasChart 
          history={trading.activeMetrics?.history || []}
          timeHistory={trading.activeMetrics?.timeHistory || []}
          selectedDuration={trading.duration}
          streakRuns={[]}
        />
      </div>

      {/* PADDED CONTENT CONTAINER (3cm margin on each side) */}
      <div className="px-[3cm] flex-1 flex flex-col gap-2 p-2 min-h-0">
        
        {/* OPERATIONS COMPONENT WRAPPER */}
        <div className="bg-[#0a0a0d] border border-[#16161f] p-3 rounded flex flex-col gap-3">
          
          {/* DENSITY WAVE MATRIX RESPONSE DATA TABLE */}
          <div className="bg-[#020204] border border-[#16161f] rounded overflow-hidden">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-[#09090c] text-[#444b55] font-bold text-[9px]">
                  <th className="py-1 border border-[#16161f] text-center">Stride</th>
                  <th className="py-1 border border-[#16161f] text-center">Up</th>
                  <th className="py-1 border border-[#16161f] text-center">Down</th>
                </tr>
              </thead>
              <tbody className="text-[#ffffff] font-bold">
                <tr 
                  className={`cursor-pointer transition-colors duration-150 ${trading.duration === 3 ? 'bg-[#161622]' : 'hover:bg-[#08080c]'}`}
                  onClick={() => trading.setDuration(3)}
                >
                  <td className={`py-0.5 border border-[#16161f] text-center font-bold ${trading.duration === 3 ? 'text-[#38bdf8]' : 'text-[#444b55]'}`}>3 Ticks</td>
                  <td className="py-0.5 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[3].up || 0}</td>
                  <td className="py-0.5 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[3].down || 0}</td>
                </tr>
                <tr 
                  className={`cursor-pointer transition-colors duration-150 ${trading.duration === 4 ? 'bg-[#161622]' : 'hover:bg-[#08080c]'}`}
                  onClick={() => trading.setDuration(4)}
                >
                  <td className={`py-0.5 border border-[#16161f] text-center font-bold ${trading.duration === 4 ? 'text-[#38bdf8]' : 'text-[#444b55]'}`}>4 Ticks</td>
                  <td className="py-0.5 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[4].up || 0}</td>
                  <td className="py-0.5 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[4].down || 0}</td>
                </tr>
                <tr 
                  className={`cursor-pointer transition-colors duration-150 ${trading.duration === 5 ? 'bg-[#161622]' : 'hover:bg-[#08080c]'}`}
                  onClick={() => trading.setDuration(5)}
                >
                  <td className={`py-0.5 border border-[#16161f] text-center font-bold ${trading.duration === 5 ? 'text-[#38bdf8]' : 'text-[#444b55]'}`}>5 Ticks</td>
                  <td className="py-0.5 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[5].up || 0}</td>
                  <td className="py-0.5 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[5].down || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NOTIFIER STATUS BADGE */}
          {(() => {
            let signal: 'BUY' | 'WAIT' = 'WAIT';
            if (trading.activeMetrics?.isPendingDelay) {
              const ticksRemaining = trading.activeMetrics.delayExpiryTick - trading.activeMetrics.globalTickCounter;
              if (ticksRemaining <= 2) {
                signal = 'BUY';
              } else {
                signal = 'WAIT';
              }
            }
            return (
              <div className="flex justify-center items-center h-[28px] select-none mb-1">
                <div className={`flex items-center gap-1.5 px-4 py-0.5 rounded-full border text-[10px] font-bold transition shadow-md uppercase tracking-wider ${
                  signal === 'BUY' 
                    ? 'bg-[#00e699]/10 border-[#00e699] text-[#00e699] animate-pulse shadow-[0_0_12px_rgba(0,230,153,0.2)]' 
                    : 'bg-[#facc15]/10 border-[#facc15]/40 text-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.08)]'
                }`}>
                  <span>Notifier: {signal}</span>
                </div>
              </div>
            );
          })()}

          {/* DIRECT TRIGGER BUTTON ACTIONS */}
          <div className="flex justify-center gap-4 mt-2">
            <button 
              className="bg-[#00e699] text-[#000] font-bold text-sm h-[40px] w-[120px] rounded-lg cursor-pointer uppercase hover:opacity-90 active:scale-[0.99] transition shadow-[0_4px_14px_rgba(0,230,153,0.39)]"
              onClick={() => trading.executeOrderPayload(trading.selectedAsset, 'CALL')}
            >
              Up
            </button>
            <button 
              className="bg-[#ff3355] text-[#fff] font-bold text-sm h-[40px] w-[120px] rounded-lg cursor-pointer uppercase hover:opacity-90 active:scale-[0.99] transition shadow-[0_4px_14px_rgba(255,51,85,0.39)]"
              onClick={() => trading.executeOrderPayload(trading.selectedAsset, 'PUT')}
            >
              Down
            </button>
          </div>

        </div>

        {/* TERMINAL STATUS BUFFER READOUT BOX */}
        <div className="p-2 bg-[#0a0a0d] border border-[#16161f] h-[120px] flex flex-col min-h-0 rounded">
          <div className="flex-1 overflow-y-auto p-1 bg-[#020204] font-mono text-[10px] text-[#ffffff] font-bold leading-normal">
            {trading.simulationLogs.length === 0 ? (
              <div className="text-[#444b55]">Standby...</div>
            ) : (
              trading.simulationLogs.map((log: string, idx: number) => <div key={idx}>{log}</div>)
            )}
          </div>
        </div>
      </div>

      {/* NEUROMORPHIC GLASS STATS CARD SIDEBAR POPPING */}
      <div 
        className={`fixed top-[80px] z-50 bg-[#0a0a0d]/80 backdrop-blur-lg border border-white/10 rounded-xl shadow-[8px_8px_24px_rgba(0,0,0,0.6),-4px_-4px_16px_rgba(255,255,255,0.02)] p-5 flex flex-col font-mono transition-all duration-300 ${
          showStats ? 'right-4 opacity-100 scale-100' : '-right-[6cm] opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ width: '5.5cm', height: 'auto' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3 select-none">
          <span className="text-[10px] font-bold text-[#facc15] uppercase tracking-wider truncate mr-1">
            {assetOptions.find(opt => opt.value === trading.selectedAsset)?.label || trading.selectedAsset}
          </span>
          <button 
            onClick={() => setShowStats(false)}
            className="text-white/60 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 text-[10px] leading-normal">
          <div>
            <div className="text-white/40 uppercase text-[8px] font-bold">Total Ticks</div>
            <div className="text-white font-bold text-xs mt-0.5">{trading.activeMetrics?.globalTickCounter || 0}</div>
          </div>

          <div>
            <div className="text-white/40 uppercase text-[8px] font-bold">Current Streak</div>
            <div className="text-white font-bold text-xs mt-0.5 flex items-center gap-1">
              {trading.activeMetrics?.currentStreak || 0}
              {trading.activeMetrics?.lastDirection === 1 && <span className="text-[#00e699]">▲ UP</span>}
              {trading.activeMetrics?.lastDirection === -1 && <span className="text-[#ff3355]">▼ DOWN</span>}
              {!trading.activeMetrics?.lastDirection && <span className="text-white/40">STANDBY</span>}
            </div>
          </div>

          <div className="border-t border-white/5 pt-2 flex flex-col gap-2.5">
            <div>
              <div className="text-[#38bdf8] font-bold text-[9px] uppercase">3 Ticks Stride</div>
              <div className="grid grid-cols-2 gap-x-1 mt-0.5 text-white/70">
                <span>Avg Gap:</span>
                <span className="text-right text-white font-bold">{trading.activeMetrics?.avgGaps[3] || 0}t</span>
                <span>Cur Gap:</span>
                <span className="text-right text-white font-bold">
                  {trading.activeMetrics?.globalTickCounter && trading.activeMetrics?.lastRunTick[3] 
                    ? (trading.activeMetrics.globalTickCounter - trading.activeMetrics.lastRunTick[3]) 
                    : 0}t
                </span>
                <span>Runs U/D:</span>
                <span className="text-right text-white font-bold">
                  {trading.activeMetrics?.counts[3].up || 0}/{trading.activeMetrics?.counts[3].down || 0}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[#38bdf8] font-bold text-[9px] uppercase">4 Ticks Stride</div>
              <div className="grid grid-cols-2 gap-x-1 mt-0.5 text-white/70">
                <span>Avg Gap:</span>
                <span className="text-right text-white font-bold">{trading.activeMetrics?.avgGaps[4] || 0}t</span>
                <span>Cur Gap:</span>
                <span className="text-right text-white font-bold">
                  {trading.activeMetrics?.globalTickCounter && trading.activeMetrics?.lastRunTick[4] 
                    ? (trading.activeMetrics.globalTickCounter - trading.activeMetrics.lastRunTick[4]) 
                    : 0}t
                </span>
                <span>Runs U/D:</span>
                <span className="text-right text-white font-bold">
                  {trading.activeMetrics?.counts[4].up || 0}/{trading.activeMetrics?.counts[4].down || 0}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[#38bdf8] font-bold text-[9px] uppercase">5 Ticks Stride</div>
              <div className="grid grid-cols-2 gap-x-1 mt-0.5 text-white/70">
                <span>Avg Gap:</span>
                <span className="text-right text-white font-bold">{trading.activeMetrics?.avgGaps[5] || 0}t</span>
                <span>Cur Gap:</span>
                <span className="text-right text-white font-bold">
                  {trading.activeMetrics?.globalTickCounter && trading.activeMetrics?.lastRunTick[5] 
                    ? (trading.activeMetrics.globalTickCounter - trading.activeMetrics.lastRunTick[5]) 
                    : 0}t
                </span>
                <span>Runs U/D:</span>
                <span className="text-right text-white font-bold">
                  {trading.activeMetrics?.counts[5].up || 0}/{trading.activeMetrics?.counts[5].down || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}