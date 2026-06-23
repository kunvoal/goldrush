'use client';

import React, { useEffect, useRef } from 'react';
import { Header } from '@/components/custom/header';
import { Footer } from '@/components/custom/footer';

export interface RiseFallViewProps {
  authState: any;
  accounts: any[];
  activeAccount: any;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  trading: any;
}

export function RiseFallView({
  authState, accounts, activeAccount, onLogin, onSignUp, onLogout, onSwitchAccount, trading
}: RiseFallViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trading.activeMetrics) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const H = (canvas.height = canvas.parentElement?.clientHeight || 240);
    ctx.clearRect(0, 0, W, H);

    const quotes = trading.activeMetrics.history;
    const times = trading.activeMetrics.timeHistory;
    if (quotes.length < 2) {
      ctx.fillStyle = '#444b55';
      ctx.font = '10px monospace';
      ctx.fillText('AWAITING TELEMETRY TICK PIPELINE PACKETS STREAMING MATRIX...', 15, H / 2);
      return;
    }

    let minQ = Math.min(...quotes), maxQ = Math.max(...quotes);
    const rangeQ = maxQ - minQ || 0.001;
    const rangeT = times[times.length - 1] - times[0] || 1;

    const getX = (t: number) => ((t - times[0]) / rangeT) * W;
    const getY = (q: number) => H - 15 - ((q - minQ) / rangeQ) * (H - 30);

    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    for (let i = 0; i < quotes.length; i++) {
      if (i === 0) ctx.moveTo(getX(times[i]), getY(quotes[i]));
      else ctx.lineTo(getX(times[i]), getY(quotes[i]));
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px monospace';
    ctx.fillText(`MAX: ${maxQ.toFixed(4)}`, 8, 12);
    ctx.fillText(`MIN: ${minQ.toFixed(4)}`, 8, H - 4);
  }, [trading.activeMetrics, trading.activeMetrics?.history.length]);

  return (
    <main className="flex flex-col bg-[#050507] text-[#c9ced6] min-h-screen font-mono antialiased select-none">
      <Header
        authState={authState} accounts={accounts} activeAccount={activeAccount}
        onLogin={onLogin} onSignUp={onSignUp} onLogout={onLogout} onSwitchAccount={onSwitchAccount}
      />
      <div className="h-[64px] shrink-0" />

      {/* TOP CONTROL PLATFORM LINK STRIP */}
      <div className="m-2 p-2 bg-[#0a0a0d] border border-[#16161f] flex items-center justify-between gap-2 flex-wrap rounded">
        <div className="bg-[#020204] border border-[#16161f] p-1 px-3 font-bold text-xs rounded">
          <span className="text-[#444b55]">LIVE REFL PORTFOLIO:</span>{' '}
          <span className="text-[#00e699]">${activeAccount ? Number(activeAccount.balance).toFixed(2) : '0.00'}</span>
        </div>

        <select 
          className="bg-[#020204] border border-[#16161f] text-[#38bdf8] font-bold text-xs p-1.5 px-3 outline-none cursor-pointer rounded"
          value={trading.selectedAsset}
          onChange={(e) => trading.setSelectedAsset(e.target.value)}
        >
          <option value="R_10">VOLATILITY 10 INDEX</option>
          <option value="R_25">VOLATILITY 25 INDEX</option>
          <option value="R_50">VOLATILITY 50 INDEX</option>
          <option value="R_100">VOLATILITY 100 INDEX</option>
          <option value="1HZ10V">VOLATILITY 10 (1S) INDEX</option>
          <option value="1HZ25V">VOLATILITY 25 (1S) INDEX</option>
          <option value="1HZ50V">VOLATILITY 50 (1S) INDEX</option>
          <option value="1HZ100V">VOLATILITY 100 (1S) INDEX</option>
        </select>
      </div>

      {/* WORKSTATION VIEWPORT VIEW PANELS */}
      <div className="flex-1 grid grid-rows-[1fr_auto] gap-2 p-2 min-h-0">
        
        {/* UPPER WINDOW CONTAINER MODULE */}
        <div className="bg-[#0a0a0d] border border-[#16161f] p-2 flex flex-col min-h-[240px] rounded relative">
          <div className="text-[10px] font-bold text-[#444b55] border-b border-[#16161f] pb-1 mb-1 flex justify-between uppercase">
            <span>Unified Path Dependency Trajectory Visualizer</span>
            <span className="text-[#38bdf8]">{trading.selectedAsset} AXIS ACTIVE</span>
          </div>
          <div className="flex-1 bg-[#020204] relative rounded overflow-hidden">
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
          </div>
        </div>

        {/* CONTROLS SWITCH PARAMETERS BLOCK */}
        <div className="bg-[#0a0a0d] border border-[#16161f] p-3 rounded flex flex-col gap-3">
          
          {/* RESPONSIVE RADIO BUTTON MODE SWITCHES BLOCK */}
          <div className="flex items-center justify-between border-b border-[#16161f] pb-2.5">
            <span className="text-[10px] font-bold text-[#444b55] uppercase tracking-wider">RUN TIME STRATEGY MODE:</span>
            <div className="flex items-center gap-4 bg-[#020204] p-1.5 px-3 border border-[#16161f] rounded">
              <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase text-[#c9ced6]">
                <input 
                  type="radio" name="engineMode" value="manual"
                  checked={trading.executionMode === 'manual'}
                  onChange={() => trading.setExecutionMode('manual')}
                  className="w-3 h-3 accent-[#facc15] cursor-pointer"
                />
                Manual Mode
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase text-[#c9ced6]">
                <input 
                  type="radio" name="engineMode" value="dynamic"
                  checked={trading.executionMode === 'dynamic'}
                  onChange={() => trading.setExecutionMode('dynamic')}
                  className="w-3 h-3 accent-[#ec4899] cursor-pointer"
                />
                Dynamic Trigger
              </label>
            </div>
          </div>

          {/* PARAMETERS STRIDE INPUT MATRIX ROW */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-[#020204] border border-[#16161f] p-1.5 rounded">
              <span className="text-[9px] text-[#444b55] font-bold uppercase">STAKE CONTEXT UNITS</span>
              <input 
                type="number" step="0.01" className="bg-transparent font-bold text-xs text-[#facc15] outline-none border-none mt-0.5"
                value={trading.globalStake} onChange={(e) => trading.setGlobalStake(parseFloat(e.target.value) || 0.35)}
              />
            </div>
            <div className="flex flex-col bg-[#020204] border border-[#16161f] p-1.5 rounded">
              <span className="text-[9px] text-[#444b55] font-bold uppercase">MOMENTUM TARGET BOUNDARY</span>
              <select 
                className="bg-transparent font-bold text-xs text-[#38bdf8] outline-none border-none mt-0.5 cursor-pointer"
                value={trading.targetTickConfig} onChange={(e) => trading.setTargetTickCondition(parseInt(e.target.value, 10))}
              >
                <option value="3">3 Ticks Match</option>
                <option value="4">4 Ticks Match</option>
                <option value="5">5 Ticks Match</option>
              </select>
            </div>
          </div>

          {/* HIGH-DENSITY METRICS WAVE STATE RESPONSE TABLE */}
          <div className="bg-[#020204] border border-[#16161f] rounded overflow-hidden">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-[#09090c] text-[#444b55] font-bold text-[9px]">
                  <th className="p-1.5 border border-[#16161f]">WAVE VECTOR STRIDE INDEX</th>
                  <th className="p-1.5 border border-[#16161f]">UPRUN CONFIRMED</th>
                  <th className="p-1.5 border border-[#16161f]">DOWNRUN CONFIRMED</th>
                </tr>
              </thead>
              <tbody className="text-[#ffffff] font-bold">
                <tr>
                  <td className="p-2 border border-[#16161f] text-left text-[#444b55]">Sequence L3 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[3].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[3].down || 0}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-[#16161f] text-left text-[#444b55]">Sequence L4 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[4].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[4].down || 0}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-[#16161f] text-left text-[#444b55]">Sequence L5 Ticks</td>
                  <td className="p-2 border border-[#16161f] text-[#00e699]">{trading.activeMetrics?.counts[5].up || 0}</td>
                  <td className="p-2 border border-[#16161f] text-[#ff3355]">{trading.activeMetrics?.counts[5].down || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* MANUAL EXECUTIONS PURE INSTITUTIONAL OVERLAYS */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button 
              className="bg-[#00e699] text-[#000] font-bold text-xs p-2.5 rounded cursor-pointer uppercase hover:opacity-90 active:scale-[0.99] transition"
              onClick={() => trading.executeOrderPayload(trading.selectedAsset, 'CALL')}
            >
              UP ONLY (CALL)
            </button>
            <button 
              className="bg-[#ff3355] text-[#fff] font-bold text-xs p-2.5 rounded cursor-pointer uppercase hover:opacity-90 active:scale-[0.99] transition"
              onClick={() => trading.executeOrderPayload(trading.selectedAsset, 'PUT')}
            >
              DOWN ONLY (PUT)
            </button>
          </div>

        </div>
      </div>

      {/* FULL-WIDTH ACCOUNT LOG STREAM TERMINAL */}
      <div className="m-2 p-2 bg-[#0a0a0d] border border-[#16161f] h-[120px] flex flex-col min-h-0 rounded">
        <div className="font-bold text-[9px] text-[#444b55] pb-1 border-b border-[#16161f] mb-1 uppercase tracking-wider">
          System Operation Logstream Telemetry Terminal
        </div>
        {/* SOLID TEXT COMPLIANCE PASS: Clear of wash-outs, forced to bright solid white (#ffffff) */}
        <div className="flex-1 overflow-y-auto p-1 bg-[#020204] font-mono text-[10px] text-[#ffffff] font-bold leading-normal">
          {trading.simulationLogs.length === 0 ? (
            <div className="text-[#444b55]">Pipeline standby. Stream vector connections active...</div>
          ) : (
            trading.simulationLogs.map((log: string, idx: number) => <div key={idx}>{log}</div>)
          )}
        </div>
      </div>
    </main>
  );
}