import React, { useState } from 'react';
import { Activity, Shield } from 'lucide-react';
import type { AnalyticsResponse, ScatterPoint } from '../types/aqi';

interface HealthViewProps {
  analytics: AnalyticsResponse | null;
}

export const HealthView: React.FC<HealthViewProps> = ({ analytics }) => {
  const [hoveredCity, setHoveredCity] = useState<ScatterPoint | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!analytics) {
    return (
      <div className="clay-card rounded-3xl p-8 text-center text-[#45483F]">
        Loading regression chart...
      </div>
    );
  }

  const lr = analytics.linear_regression;
  const activePoint =
    hoveredCity ??
    lr.scatter_points.find((p) => p.city === analytics.city) ??
    lr.scatter_points[lr.scatter_points.length - 1];

  const w = 520;
  const h = 250;
  const padL = 44;
  const padR = 24;
  const padT = 22;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxX = 215;
  const minY = 40;
  const maxY = 210;

  const toX = (pm25: number) => padL + (Math.min(maxX, Math.max(0, pm25)) / maxX) * innerW;
  const toY = (mort: number) =>
    padT + innerH - ((Math.min(maxY, Math.max(minY, mort)) - minY) / (maxY - minY)) * innerH;

  const lineStart = lr.regression_line[0];
  const lineEnd = lr.regression_line[lr.regression_line.length - 1];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#283618]">
        PM2.5 Health &amp; Mortality Impact
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 clay-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#283618]">
            Annual PM2.5 vs. Mortality Rate
          </h2>

          <div className="clay-inset rounded-2xl p-3 bg-[#FEFAE0]">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-64 overflow-visible">
              {[60, 100, 140, 180].map((yVal) => {
                const y = toY(yVal);
                return (
                  <g key={yVal}>
                    <line
                      x1={padL}
                      x2={w - padR}
                      y1={y}
                      y2={y}
                      stroke="#283618"
                      strokeOpacity="0.12"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9.5"
                      fill="#45483F"
                      fontFamily="JetBrains Mono"
                    >
                      {yVal}
                    </text>
                  </g>
                );
              })}

              {[0, 50, 100, 150, 200].map((xVal) => (
                <text
                  key={xVal}
                  x={toX(xVal)}
                  y={h - 10}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#45483F"
                  fontFamily="JetBrains Mono"
                >
                  {xVal}
                </text>
              ))}

              <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="#283618" strokeWidth="1.4" />
              <line x1={padL} x2={w - padR} y1={padT + innerH} y2={padT + innerH} stroke="#283618" strokeWidth="1.4" />

              {lineStart && lineEnd && (
                <polygon
                  points={`${toX(lineStart.pm25)},${toY(lineStart.mortality + 9)} ${toX(lineEnd.pm25)},${toY(lineEnd.mortality + 12)} ${toX(lineEnd.pm25)},${toY(lineEnd.mortality - 12)} ${toX(lineStart.pm25)},${toY(lineStart.mortality - 9)}`}
                  fill="#BC6C25"
                  fillOpacity="0.12"
                />
              )}

              {lineStart && lineEnd && (
                <line
                  x1={toX(lineStart.pm25)}
                  y1={toY(lineStart.mortality)}
                  x2={toX(lineEnd.pm25)}
                  y2={toY(lineEnd.mortality)}
                  stroke="#BC6C25"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              )}

              {lr.scatter_points.map((pt) => {
                const cx = toX(pt.pm25);
                const cy = toY(pt.mortality);
                const isActive = activePoint?.city === pt.city;
                const fill =
                  pt.pm25 > 120 ? '#BC6C25' : pt.pm25 > 60 ? '#DDA15E' : '#606C38';
                return (
                  <g
                    key={pt.city}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCity(pt)}
                    onClick={() => setHoveredCity(pt)}
                  >
                    {isActive && (
                      <circle cx={cx} cy={cy} r={12} fill={fill} fillOpacity="0.22" />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActive ? 7 : 5}
                      fill={fill}
                      stroke="#FEFAE0"
                      strokeWidth={isActive ? 2.2 : 1.5}
                    />
                    <text
                      x={cx + 8}
                      y={cy + 3}
                      fontSize="9"
                      fontWeight={isActive ? '700' : '600'}
                      fill="#283618"
                    >
                      {pt.city}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#45483F]">
            <span>Y: Mortality / 100k · X: PM2.5 (µg/m³)</span>
            {activePoint && (
              <span className="font-mono-tabular font-semibold text-[#283618]">
                {activePoint.city}: {activePoint.pm25} µg/m³ → {activePoint.mortality}
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="clay-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[#606C38]">
                <span>Relative Risk</span>
                <Activity className="w-4 h-4" />
              </div>
              <p className="font-mono-tabular text-3xl font-bold text-[#283618] mt-2">1.34x</p>
            </div>

            <div className="clay-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[#BC6C25]">
                <span>Years Lost</span>
                <Shield className="w-4 h-4" />
              </div>
              <p className="font-mono-tabular text-3xl font-bold text-[#BC6C25] mt-2">6.1 yrs</p>
            </div>
          </div>

          <div className="clay-card rounded-3xl p-2 overflow-hidden">
            <div className="relative h-44 rounded-2xl overflow-hidden bg-[#283618]">
              {!imgError && (
                <img
                  src="/src/assets/images/pulmonary_field_cohort_1795104968071.jpg"
                  alt="Public health researchers measuring particulate air quality"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#283618]/85 via-transparent to-transparent flex items-end p-4">
                <p className="text-xs font-semibold text-[#FEFAE0]">
                  Field Air Quality Monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
