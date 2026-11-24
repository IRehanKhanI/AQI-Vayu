import React, { useState } from 'react';
import type { AnalyticsResponse } from '../types/aqi';

interface AnalyticsViewProps {
  analytics: AnalyticsResponse | null;
  loading: boolean;
}

type Timeframe = '24h' | '7d' | '30d' | 'season';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, loading }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (loading || !analytics) {
    return (
      <div className="clay-card rounded-3xl p-8 text-center text-[#45483F]">
        Loading analytics...
      </div>
    );
  }

  const series =
    timeframe === '24h'
      ? analytics.trend_24h
      : timeframe === '7d'
        ? analytics.trend_7d
        : timeframe === '30d'
          ? analytics.trend_30d
          : analytics.trend_season;

  const maxAqi = Math.max(360, ...series.map((p) => p.aqi));
  const chartW = 540;
  const chartH = 210;
  const padL = 40;
  const padR = 16;
  const padT = 18;
  const padB = 28;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const coords = series.map((pt, i) => {
    const x = padL + (series.length <= 1 ? 0 : (i / (series.length - 1)) * innerW);
    const y = padT + innerH - (pt.aqi / maxAqi) * innerH;
    return { ...pt, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${padT + innerH} L ${coords[0].x} ${padT + innerH} Z`
      : '';

  const activePoint =
    hoverIdx !== null && coords[hoverIdx] ? coords[hoverIdx] : coords[coords.length - 1];
  const peakPoint = coords.reduce(
    (best, cur) => (cur.aqi > best.aqi ? cur : best),
    coords[0],
  );

  const corrLabels = analytics.correlation_matrix.labels.slice(0, 4);
  const corrMatrix = analytics.correlation_matrix.matrix;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#283618]">
          Pollution Analytics &amp; Trends
        </h1>

        <div className="clay-inset p-1.5 rounded-2xl inline-grid grid-cols-4 gap-1 self-start">
          {(
            [
              ['24h', '24H'],
              ['7d', '7D'],
              ['30d', '30D'],
              ['season', 'Season'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTimeframe(key);
                setHoverIdx(null);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                timeframe === key
                  ? 'bg-[#283618] text-[#FEFAE0] shadow-sm'
                  : 'text-[#45483F] hover:text-[#283618]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Chart Card */}
      <div className="clay-card rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#606C38]">
              {analytics.city} Trajectory
            </span>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="font-mono-tabular text-2xl font-bold text-[#283618]">
                AQI {activePoint?.aqi ?? 0}
              </span>
              <span className="text-xs font-semibold text-[#45483F]">
                {activePoint?.date}
              </span>
            </div>
          </div>

          <div className="clay-inset px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#45483F] block">
              Peak
            </span>
            <span className="font-mono-tabular text-sm font-bold text-[#BC6C25]">
              {peakPoint?.aqi} AQI
            </span>
          </div>
        </div>

        <div className="clay-inset rounded-2xl p-3">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-56 overflow-visible">
            <defs>
              <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BC6C25" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#FEFAE0" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[100, 200, 300].map((level) => {
              const y = padT + innerH - (level / maxAqi) * innerH;
              const color = level === 300 ? '#BA1A1A' : level === 200 ? '#BC6C25' : '#606C38';
              return (
                <g key={level}>
                  <line
                    x1={padL}
                    x2={chartW - padR}
                    y1={y}
                    y2={y}
                    stroke={color}
                    strokeOpacity="0.4"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={padL - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#45483F"
                    fontFamily="JetBrains Mono"
                  >
                    {level}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill="url(#aqiAreaGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="#283618"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {activePoint && (
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={padT}
                y2={padT + innerH}
                stroke="#BC6C25"
                strokeDasharray="3 3"
                strokeOpacity="0.7"
              />
            )}

            {coords.map((pt, idx) => {
              const isSelected = activePoint?.date === pt.date;
              const showLabel =
                coords.length <= 8 || idx === 0 || idx === coords.length - 1 || idx % 5 === 0;
              return (
                <g key={`${pt.date}-${idx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5.5 : 3.5}
                    fill={isSelected ? '#BC6C25' : '#DDA15E'}
                    stroke="#283618"
                    strokeWidth={isSelected ? 2 : 1.2}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIdx(idx)}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={14}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIdx(idx)}
                    onClick={() => setHoverIdx(idx)}
                  />
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={chartH - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#45483F"
                    >
                      {pt.date.length > 5 ? pt.date.slice(5) : pt.date}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Grid: City Comparisons + Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 clay-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#283618]">
            City AQI Comparison
          </h2>

          <div className="space-y-3.5">
            {analytics.city_comparisons.slice(0, 7).map((item) => {
              const pct = Math.min(100, Math.round((item.avg_aqi / 320) * 100));
              const fill =
                item.category === 'Good'
                  ? 'bg-[#606C38]'
                  : item.category === 'Moderate'
                    ? 'bg-[#DDA15E]'
                    : 'bg-gradient-to-r from-[#BC6C25] to-[#DDA15E]';
              return (
                <div key={item.city} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-[#283618]">{item.city}</span>
                    <span className="font-mono-tabular font-bold text-[#283618]">
                      {item.avg_aqi} AQI
                    </span>
                  </div>
                  <div className="w-full h-3 clay-inset rounded-full p-0.5 overflow-hidden">
                    <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 clay-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#283618]">
            Pollutant Correlation Matrix
          </h2>

          <div className="clay-inset p-3.5 rounded-2xl overflow-x-auto">
            <div className="min-w-[290px] space-y-2">
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold text-[#283618]">
                <span />
                {corrLabels.map((lbl) => (
                  <span key={lbl}>{lbl}</span>
                ))}
              </div>
              {corrLabels.map((rowLbl, rIdx) => (
                <div key={rowLbl} className="grid grid-cols-5 gap-2 items-center text-center">
                  <span className="text-left text-xs font-bold text-[#283618]">{rowLbl}</span>
                  {corrLabels.map((_, cIdx) => {
                    const val = corrMatrix[rIdx]?.[cIdx] ?? 0;
                    const chipStyle =
                      val >= 0.75
                        ? 'bg-[#BC6C25] text-[#FEFAE0]'
                        : val >= 0.45
                          ? 'bg-[#DDA15E] text-[#283618]'
                          : 'bg-[#606C38] text-[#FEFAE0]';
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`font-mono-tabular py-2.5 rounded-xl text-xs font-bold shadow-sm ${chipStyle}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
