'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { UpDownAssetMetrics } from '@/hooks/use-rise-fall-trading';

interface StreakRun {
  startTime: number;
  endTime: number;
  length: number;
  direction: number; // 1 = up, -1 = down
}

export interface TickCanvasChartProps {
  /** Price history array */
  history: number[];
  /** Timestamp history (parallel to history) */
  timeHistory: number[];
  /** Currently selected tick duration (3, 4, or 5) */
  selectedDuration: number;
  /** Streak run events for overlay rendering */
  streakRuns: StreakRun[];
  /** Pip size for price formatting */
  pipSize?: number;
}

export function TickCanvasChart({
  history,
  timeHistory,
  selectedDuration,
  streakRuns,
  pipSize = 2,
}: TickCanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1.0);
  const offsetRef = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const [, forceRender] = useState(0);

  const [timeframe, setTimeframe] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, 0, W, H);

    // Logical dimensions
    const lW = W / dpr;
    const lH = H / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    if (history.length < 2) {
      ctx.fillStyle = '#444b55';
      ctx.font = '11px monospace';
      ctx.fillText('Waiting for tick data stream...', 20, lH / 2);
      ctx.restore();
      return;
    }

    // Filter quotes/times based on selected timeframe
    let quotes = history;
    let times = timeHistory;

    if (timeframe !== 'all' && timeHistory.length > 0) {
      const latestTime = timeHistory[timeHistory.length - 1];
      const limitMs = timeframe === '1m' ? 60000 : timeframe === '2m' ? 120000 : 300000;
      const cutoff = latestTime - limitMs;
      
      const startIndex = timeHistory.findIndex(t => t >= cutoff);
      if (startIndex !== -1) {
        quotes = history.slice(startIndex);
        times = timeHistory.slice(startIndex);
      }
    }

    const len = quotes.length;

    let minQ = Math.min(...quotes);
    let maxQ = Math.max(...quotes);
    if (maxQ === minQ) { maxQ += 0.0001; minQ -= 0.0001; }
    const rangeQ = maxQ - minQ;

    const minT = times[0];
    const maxT = times[len - 1];
    const rangeT = (maxT - minT) || 1;

    const zoom = zoomRef.current;
    const offset = offsetRef.current;

    const getX = (t: number) => ((t - minT) / rangeT) * lW * zoom + offset;
    const getY = (q: number) => lH - 20 - ((q - (minQ - rangeQ * 0.05)) / (rangeQ * 1.1)) * (lH - 40);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = 20 + (i / 4) * (lH - 40);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(lW, y);
      ctx.stroke();
    }

    // Streak run highlight bands (blue)
    const activeRuns: StreakRun[] = [];
    if (quotes.length >= 2) {
      let currentStreak = 1;
      let lastDir = 0;
      for (let i = 1; i < quotes.length; i++) {
        const delta = quotes[i] - quotes[i - 1];
        const dir = delta > 0 ? 1 : delta < 0 ? -1 : 0;
        if (dir !== 0 && dir === lastDir) {
          currentStreak++;
          if (currentStreak === selectedDuration) {
            const run = {
              startTime: times[i - (selectedDuration - 1)],
              endTime: times[i],
              length: selectedDuration,
              direction: dir
            };
            
            let include = true;
            if (directionFilter === 'up' && dir !== 1) include = false;
            if (directionFilter === 'down' && dir !== -1) include = false;
            
            if (include) {
              activeRuns.push(run);
            }
          }
        } else {
          lastDir = dir;
          currentStreak = 1;
        }
      }
    }

    for (let i = 0; i < activeRuns.length; i++) {
      const run = activeRuns[i];
      const xStart = getX(run.startTime);
      const xEnd = getX(run.endTime);

      if (xEnd >= 0 && xStart <= lW) {
        // Blue highlight band
        ctx.fillStyle = run.direction === 1
          ? 'rgba(0, 230, 153, 0.10)'
          : 'rgba(255, 51, 85, 0.10)';
        ctx.fillRect(xStart, 0, Math.max(xEnd - xStart, 2), lH);

        // Vertical markers
        ctx.strokeStyle = run.direction === 1
          ? 'rgba(0, 230, 153, 0.35)'
          : 'rgba(255, 51, 85, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xStart, 0); ctx.lineTo(xStart, lH);
        ctx.moveTo(xEnd, 0); ctx.lineTo(xEnd, lH);
        ctx.stroke();
      }

      // Gap labels between consecutive runs
      if (i > 0) {
        const prevRun = activeRuns[i - 1];
        const gapSeconds = Math.floor((run.startTime - prevRun.endTime) / 1000);

        if (gapSeconds > 2) {
          const midX = getX(prevRun.endTime + (run.startTime - prevRun.endTime) / 2);
          if (midX > 10 && midX < lW - 10) {
            // Find all quotes that are inside this gap time window
            const gapQuotes: number[] = [];
            for (let k = 0; k < len; k++) {
              if (times[k] >= prevRun.endTime && times[k] <= run.startTime) {
                gapQuotes.push(quotes[k]);
              }
            }
            let gapAvgY = lH / 2;
            if (gapQuotes.length > 0) {
              const sumY = gapQuotes.reduce((acc, q) => acc + getY(q), 0);
              gapAvgY = sumY / gapQuotes.length;
            }

            // Dynamically position label above or below the price line to prevent overlap
            let labelY = gapAvgY > lH / 2 ? gapAvgY - 35 : gapAvgY + 35;
            
            // Safe bounds check to keep badges inside the canvas
            if (labelY < 25) labelY = gapAvgY + 35;
            if (labelY > lH - 25) labelY = gapAvgY - 35;

            const textStr = String(gapSeconds);
            ctx.font = 'bold 9px monospace';
            const textWidth = ctx.measureText(textStr).width;
            const padX = 5;
            const padY = 3;
            
            ctx.fillStyle = 'rgba(2, 2, 5, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            
            // Draw capsule badge
            const rectW = textWidth + padX * 2;
            const rectH = 12 + padY * 2;
            const rectX = midX - rectW / 2;
            const rectY = labelY - rectH / 2;
            
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(rectX, rectY, rectW, rectH, 3);
            } else {
              ctx.rect(rectX, rectY, rectW, rectH);
            }
            ctx.fill();
            ctx.stroke();

            // Draw gap digit
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(textStr, midX, labelY);
            ctx.textBaseline = 'alphabetic'; // restore default
            ctx.textAlign = 'left';
          }
        }
      }
    }

    // Price line
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    for (let i = 0; i < len; i++) {
      const px = getX(times[i]);
      const py = getY(quotes[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Latest price dot
    if (len > 0) {
      const lastX = getX(times[len - 1]);
      const lastY = getY(quotes[len - 1]);
      const prevQ = len >= 2 ? quotes[len - 2] : quotes[len - 1];
      const isUp = quotes[len - 1] >= prevQ;

      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isUp ? '#00e699' : '#ff3355';
      ctx.fill();

      // Current price label
      ctx.fillStyle = isUp ? '#00e699' : '#ff3355';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(quotes[len - 1].toFixed(pipSize), lW - 4, lastY - 6);
      ctx.textAlign = 'left';
    }

    // Y-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '9px monospace';
    ctx.fillText(maxQ.toFixed(pipSize), 4, 14);
    ctx.fillText(minQ.toFixed(pipSize), 4, lH - 6);

    ctx.restore();
  }, [history, timeHistory, selectedDuration, streakRuns, pipSize, timeframe, directionFilter]);

  // Resize observer
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = wrapper.clientWidth * dpr;
      canvas.height = wrapper.clientHeight * dpr;
      canvas.style.width = `${wrapper.clientWidth}px`;
      canvas.style.height = `${wrapper.clientHeight}px`;
      redraw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    resize();

    return () => observer.disconnect();
  }, [redraw]);

  // Redraw on data change
  useEffect(() => { redraw(); }, [redraw]);

  // Mouse events for pan/zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      dragStartX.current = e.clientX - offsetRef.current;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        offsetRef.current = e.clientX - dragStartX.current;
        redraw();
      }
    };

    const handleMouseUp = () => { isDragging.current = false; };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomRef.current = Math.max(0.2, Math.min(zoomRef.current * factor, 15.0));
      redraw();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [redraw]);

  return (
    <div className="w-full h-full flex flex-col relative bg-[#020204]">
      {/* Viewport wrapper for canvas */}
      <div ref={wrapperRef} className="flex-1 relative min-h-0" style={{ cursor: 'crosshair' }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Control Strip */}
      <div className="h-[32px] shrink-0 border-t border-[#16161f] bg-[#09090c] px-[3cm] flex items-center justify-center gap-12 text-[10px] select-none">
        {/* Left: Timeframe Filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-2 py-0.5 font-bold rounded uppercase transition ${timeframe === 'all' ? 'bg-[#38bdf8] text-[#000]' : 'text-[#c9ced6] hover:bg-white/5'}`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeframe('1m')}
            className={`px-2 py-0.5 font-bold rounded uppercase transition ${timeframe === '1m' ? 'bg-[#38bdf8] text-[#000]' : 'text-[#c9ced6] hover:bg-white/5'}`}
          >
            1 Min
          </button>
          <button
            onClick={() => setTimeframe('2m')}
            className={`px-2 py-0.5 font-bold rounded uppercase transition ${timeframe === '2m' ? 'bg-[#38bdf8] text-[#000]' : 'text-[#c9ced6] hover:bg-white/5'}`}
          >
            2 Min
          </button>
          <button
            onClick={() => setTimeframe('5m')}
            className={`px-2 py-0.5 font-bold rounded uppercase transition ${timeframe === '5m' ? 'bg-[#38bdf8] text-[#000]' : 'text-[#c9ced6] hover:bg-white/5'}`}
          >
            5 Min
          </button>
        </div>

        {/* Right: Direction Filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDirectionFilter(directionFilter === 'up' ? 'all' : 'up')}
            className={`w-6 h-5 font-bold rounded flex items-center justify-center transition ${directionFilter === 'up' ? 'bg-[#00e699] text-[#000]' : 'text-[#00e699]/60 hover:bg-white/5 border border-[#00e699]/20'}`}
          >
            ▲
          </button>
          <button
            onClick={() => setDirectionFilter(directionFilter === 'down' ? 'all' : 'down')}
            className={`w-6 h-5 font-bold rounded flex items-center justify-center transition ${directionFilter === 'down' ? 'bg-[#ff3355] text-[#fff]' : 'text-[#ff3355]/60 hover:bg-white/5 border border-[#ff3355]/20'}`}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

