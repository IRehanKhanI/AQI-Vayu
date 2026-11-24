import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { AqiCategory } from '../types/aqi';

interface AqiGaugeProps {
  aqi: number;
  category: AqiCategory;
  primaryPollutant: string;
  healthAlert: string;
}

const CATEGORY_STYLE: Record<
  AqiCategory,
  {
    stroke: string;
    badgeBg: string;
    badgeText: string;
    bannerBg: string;
    bannerBorder: string;
  }
> = {
  Good: {
    stroke: '#606C38',
    badgeBg: 'bg-[#606C38]',
    badgeText: 'text-[#FEFAE0]',
    bannerBg: 'bg-[#283618]',
    bannerBorder: 'border-[#606C38]',
  },
  Moderate: {
    stroke: '#DDA15E',
    badgeBg: 'bg-[#DDA15E]',
    badgeText: 'text-[#283618]',
    bannerBg: 'bg-[#3A2E14]',
    bannerBorder: 'border-[#DDA15E]/60',
  },
  Poor: {
    stroke: '#BC6C25',
    badgeBg: 'bg-[#BC6C25]',
    badgeText: 'text-[#FEFAE0]',
    bannerBg: 'bg-[#4A2A00]',
    bannerBorder: 'border-[#BC6C25]/70',
  },
  Severe: {
    stroke: '#BA1A1A',
    badgeBg: 'bg-[#BA1A1A]',
    badgeText: 'text-[#FEFAE0]',
    bannerBg: 'bg-[#4A1414]',
    bannerBorder: 'border-[#BA1A1A]/70',
  },
};

export const AqiGauge: React.FC<AqiGaugeProps> = ({
  aqi,
  category,
  primaryPollutant,
  healthAlert,
}) => {
  const style = CATEGORY_STYLE[category];
  const clamped = Math.min(Math.max(aqi, 0), 500);
  const progress = clamped / 500;
  const radius = 78;
  const cx = 100;
  const cy = 110;
  const angle = Math.PI - progress * Math.PI;
  const knobX = cx + radius * Math.cos(angle);
  const knobY = cy - radius * Math.sin(angle);
  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - progress);

  return (
    <div className="clay-card rounded-3xl p-5 sm:p-6 flex flex-col items-center relative overflow-hidden">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#45483F]">
          National AQI Index
        </span>
        <span className="text-xs font-mono-tabular font-semibold px-3 py-1 rounded-full clay-inset text-[#606C38]">
          0–500
        </span>
      </div>

      {/* Semi-circular Gauge */}
      <div className="relative w-64 h-40 flex flex-col items-center justify-end mt-1">
        <svg className="w-60 h-36 relative z-10" fill="none" viewBox="0 0 200 124">
          <path
            d="M 22 110 A 78 78 0 0 1 178 110"
            stroke="#D5CFB3"
            strokeLinecap="round"
            strokeWidth="16"
          />
          <path
            d="M 22 110 A 78 78 0 0 1 178 110"
            stroke={style.stroke}
            strokeLinecap="round"
            strokeWidth="15"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500 ease-out"
          />
          <circle cx="22" cy="110" r="4" fill="#606C38" stroke="#FEFAE0" strokeWidth="1.5" />
          <circle cx="56" cy="48" r="3.5" fill="#606C38" stroke="#FEFAE0" strokeWidth="1.5" />
          <circle cx="100" cy="32" r="4" fill="#DDA15E" stroke="#FEFAE0" strokeWidth="1.5" />
          <circle cx="144" cy="48" r="3.5" fill="#BC6C25" stroke="#FEFAE0" strokeWidth="1.5" />
          <circle cx="178" cy="110" r="4" fill="#BA1A1A" stroke="#FEFAE0" strokeWidth="1.5" />
          <circle
            cx={knobX}
            cy={knobY}
            r="6.5"
            fill={style.stroke}
            stroke="#FEFAE0"
            strokeWidth="2.5"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute bottom-0 z-20 flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-2xl clay-inset border border-white/70">
            <span className="font-mono-tabular text-4xl font-bold text-[#283618] tracking-tight">
              {Math.round(aqi)}
            </span>
          </div>
          <span
            className={`mt-2 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm ${style.badgeBg} ${style.badgeText}`}
          >
            {category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-sm text-[#283618]">
        {category === 'Good' ? (
          <ShieldCheck className="w-4 h-4 text-[#606C38] shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-[#BC6C25] shrink-0" />
        )}
        <span>
          Primary: <strong className="font-semibold">{primaryPollutant}</strong>
        </span>
      </div>

      {/* Concise 1-line Color-Coded Health Alert Banner */}
      <div
        className={`w-full mt-4 rounded-2xl px-4 py-3 text-[#FEFAE0] border flex items-center gap-3 shadow-sm ${style.bannerBg} ${style.bannerBorder}`}
      >
        {category === 'Good' ? (
          <ShieldCheck className="w-5 h-5 text-[#DBE9A9] shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-[#DDA15E] shrink-0" />
        )}
        <p className="text-sm font-medium text-[#FEFAE0]">{healthAlert}</p>
      </div>
    </div>
  );
};
