'use client';

import React from 'react';
import { Header } from '@/components/custom/header';
import { Footer } from '@/components/custom/footer';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { TickCanvasChart } from './tick-canvas-chart';

export interface RiseFallViewProps {
  authState: any;
  accounts: any[];
  activeAccount: any;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  trading: any;
  [key: string]: any; // Open catch-all prevents template prop layout mismatches
}

export function RiseFallView({
  authState, accounts, activeAccount, onLogin, onSignUp, onLogout, onSwitchAccount, trading,
  logoSrc, appName, chartData, getQuotes, subscribeQuotes, unsubscribeQuotes
}: RiseFallViewProps) {

  return (
    <main className="flex flex-col bg-[#050507] text-[#c9ced6] min-h-screen font-mono antialiased select-none">
      <Header
        authState={authState} accounts={accounts} activeAccount={activeAccount}
        onLogin={onLogin} onSignUp={onSignUp} onLogout={onLogout} onSwitchAccount={onSwitchAccount}
        logoSrc={logoSrc} appName={appName}
        actions={
          <div className="flex items-center gap-3">
            {/* Stake Input */}
            <div className="flex items-center bg-[#020204] border border-[#16161f] px-2 py-1 rounded h-[32px]" style={{ width: '3cm' }}>
              <span className="text-[9px] text-[#444b55] font-bold uppercase mr-1">STK:</span>
              <input 
                type="text" inputMode="decimal"
                className="bg-transparent font-bold text-xs text-[#facc15] outline-none border-none w-full p-0"
                value={trading.stake} onChange={(e) => trading.setStake(e.target.value)}
              />
            </div>

            {/* Ticks Duration Dropdown */}
            <div className="flex items-center bg-[#020204] border border-[#16161f] px-2 py-1 rounded h-[32px]" style={{ width: '3cm' }}>
              <span className="text-[9px] text-[#444b55] font-bold uppercase mr-1">TKS:</span>
              <select 
                className="bg-transparent font-bold text-xs text-[#38bdf8] outline-none border-none w-full cursor-pointer p-0"
                value={trading.duration} onChange={(e) => trading.setDuration(parseInt(e.target.value, 10))}
              >
                <option value="3">3 T</option>
                <option value="4">4 T</option>
                <option value="5">5 T</option>
              </select>
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

            <ThemeToggle />
          </div>
        }
      />
      <div className="h-[64px] shrink-0" />

      <div className="flex justify-end p-2 border-b border-[#16161f] bg-[#020204]">
        <select
          value={trading.selectedAsset}
          onChange={(e) => trading.setSelectedAsset(e.target.value)}
        >
          <option value="R_10">Vol 10</option>
          <option value="R_25">Vol 25</option>
          <option value="R_50">Vol 50</option>
          <option value="R_100">Vol 100</option>
          <option value="1HZ10V">Vol 10 (1s)</option>
          <option value="1HZ25V">Vol 25 (1s)</option>
          <option value="1HZ50V">Vol 50 (1s)</option>
          <option value="1HZ100V">Vol 100 (1s)</option>
        </select>
      </div>

      {/* CORE CONTENT LAYOUT */}
      <div className="flex-1 grid grid-rows-[1fr_auto] gap-2 p-2 px-1 min-h-0">
        
        {/* CHARTS LAYER SECTION CONTAINER */}
        <div className="bg-[#0a0a0d] border border-[#16161f] p-0 flex flex-col min-h-[260px] rounded relative overflow-hidden">
          <TickCanvasChart 
            history={trading.activeMetrics?.history || []}
            timeHistory={trading.activeMetrics?.timeHistory || []}
            selectedDuration={trading.duration}
            streakRuns={[]} // To be populated if needed, but array history handles live tracking
          />
        </div>

        {/* OPERATIONS COMPONENT WRAPPER */}
        <div className="bg-[#0a0a0d] border border-[#16161f] p-3 rounded flex flex-col gap-3">
          
          {/* DENSITY WAVE MATRIX RESPONSE DATA TABLE */}
          <div className="bg-[#020204] border border-[#16161f] rounded overflow-hidden">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-[#09090c] text-[#444b55] font-bold text-[9px]">
                  <th className="p-1.5 border border-[#16161f]">Stride</th>
                  <th className="p-1.5 border border-[#16161f]">Up</th>
                  <th className="p-1.5 border border-[#16161f]">Down</th>
                </tr>
              </thead>
              <tbody className="text-[#ffffff] font-bold">
                <tr 
                  className={`cursor-pointer transition-colors duration-150 ${trading.duration === 3 ? 'bg-[#161622]' : 'hover:bg-[#08080c]'}`}
                  onClick={() => trading.setDuration(3)}
                >
                  <td className={`p-2 border border-[#16161f] text-left font-bold ${trading.duration === 3 ? 'text-[#38bdf8]' : 'text-[#444b55]'}`}>3 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[3].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[3].down || 0}</td>
                </tr>
                <tr 
                  className={`cursor-pointer transition-colors duration-150 ${trading.duration === 4 ? 'bg-[#161622]' : 'hover:bg-[#08080c]'}`}
                  onClick={() => trading.setDuration(4)}
                >
                  <td className={`p-2 border border-[#16161f] text-left font-bold ${trading.duration === 4 ? 'text-[#38bdf8]' : 'text-[#444b55]'}`}>4 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[4].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[4].down || 0}</td>
                </tr>
                <tr 
                  className={`cursor-pointer transition-colors duration-150 ${trading.duration === 5 ? 'bg-[#161622]' : 'hover:bg-[#08080c]'}`}
                  onClick={() => trading.setDuration(5)}
                >
                  <td className={`p-2 border border-[#16161f] text-left font-bold ${trading.duration === 5 ? 'text-[#38bdf8]' : 'text-[#444b55]'}`}>5 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[5].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[5].down || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

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
      </div>

      {/* TERMINAL STATUS BUFFER READOUT BOX */}
      <div className="m-2 mx-1 p-2 bg-[#0a0a0d] border border-[#16161f] h-[120px] flex flex-col min-h-0 rounded">
        <div className="flex-1 overflow-y-auto p-1 bg-[#020204] font-mono text-[10px] text-[#ffffff] font-bold leading-normal">
          {trading.simulationLogs.length === 0 ? (
            <div className="text-[#444b55]">Standby...</div>
          ) : (
            trading.simulationLogs.map((log: string, idx: number) => <div key={idx}>{log}</div>)
          )}
        </div>
      </div>
    </main>
  );
}