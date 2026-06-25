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
        logoSrc={logoSrc} appName={appName} actions={<ThemeToggle />}
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
      <div className="flex-1 grid grid-rows-[1fr_auto] gap-2 p-2 min-h-0">
        
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
          
          {/* RESPONSIVE RADIO SWITCHES */}
          <div className="flex items-center justify-between border-b border-[#16161f] pb-2.5">
            <span className="text-[10px] font-bold text-[#444b55] uppercase tracking-wider">Mode:</span>
            <div className="flex items-center gap-4 bg-[#020204] p-1.5 px-3 border border-[#16161f] rounded">
              <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase text-[#c9ced6]">
                <input 
                  type="radio" name="engineMode" value="manual"
                  checked={trading.executionMode === 'manual'}
                  onChange={() => trading.setExecutionMode('manual')}
                  className="w-3 h-3 accent-[#facc15] cursor-pointer"
                />
                Manual
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase text-[#c9ced6]">
                <input 
                  type="radio" name="engineMode" value="dynamic"
                  checked={trading.executionMode === 'dynamic'}
                  onChange={() => trading.setExecutionMode('dynamic')}
                  className="w-3 h-3 accent-[#ec4899] cursor-pointer"
                />
                Dynamic
              </label>
            </div>
          </div>

          {/* PARAMETERS INPUT GRID */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-[#020204] border border-[#16161f] p-1.5 rounded">
              <span className="text-[9px] text-[#444b55] font-bold uppercase">Stake</span>
              <input 
                type="text" inputMode="decimal"
                className="bg-transparent font-bold text-xs text-[#facc15] outline-none border-none mt-0.5 w-full"
                value={trading.stake} onChange={(e) => trading.setStake(e.target.value)}
              />
            </div>
            <div className="flex flex-col bg-[#020204] border border-[#16161f] p-1.5 rounded">
              <span className="text-[9px] text-[#444b55] font-bold uppercase">Ticks</span>
              <select 
                className="bg-transparent font-bold text-xs text-[#38bdf8] outline-none border-none mt-0.5 cursor-pointer"
                value={trading.duration} onChange={(e) => trading.setDuration(parseInt(e.target.value, 10))}
              >
                <option value="3">3 Ticks</option>
                <option value="4">4 Ticks</option>
                <option value="5">5 Ticks</option>
              </select>
            </div>
          </div>

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
                <tr>
                  <td className="p-2 border border-[#16161f] text-left text-[#444b55]">3 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[3].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[3].down || 0}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-[#16161f] text-left text-[#444b55]">4 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[4].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[4].down || 0}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-[#16161f] text-left text-[#444b55]">5 Ticks</td>
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
      <div className="m-2 p-2 bg-[#0a0a0d] border border-[#16161f] h-[120px] flex flex-col min-h-0 rounded">
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