'use client';

import dynamic from 'next/dynamic';
import type { ContractMarker } from '@/lib/chart-markers';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import type { SmartChartWrapperProps } from '@/components/custom/smart-chart';

// @deriv-com/smartcharts-champion uses `self` at module load time (browser-only global).
// Dynamic import with ssr: false prevents it from being evaluated on the server.
const SmartChartWrapper = dynamic<SmartChartWrapperProps>(
  () => import('@/components/custom/smart-chart').then((m) => m.SmartChartWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0a0d] text-[#444b55] text-xs font-mono">
        Loading chart...
      </div>
    ),
  }
);

export interface RiseFallChartProps {
  symbolKey: string;
  symbol: string | undefined;
  isConnectionOpened: boolean;
  isMobile: boolean;
  chartData: SmartChartChartData | undefined;
  getQuotes: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes: UseSmartChartsApiReturn['unsubscribeQuotes'];
  onSymbolChange?: (symbol: string) => void;
  isLive?: boolean;
  endEpoch?: number;
  /** Contract markers rendered on the chart when trades are placed. */
  contractsArray?: ContractMarker[];
}

export function RiseFallChart(props: RiseFallChartProps) {
  return (
    <SmartChartWrapper
      chartId="rise-fall-chart"
      defaultGranularity={0}
      {...props}
    />
  );
}
