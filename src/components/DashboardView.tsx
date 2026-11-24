import React, { useState } from 'react';
import { ChevronDown, Droplets, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react';
import type { CityAqiRecord } from '../types/aqi';
import { AqiGauge } from './AqiGauge';

interface DashboardViewProps {
  cities: CityAqiRecord[];
  selectedCity: CityAqiRecord | null;
  onSelectCity: (cityName: string) => void;
  onRefresh: () => void;
  onOpenPredictor: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  onRefresh,
  onOpenPredictor,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!selectedCity) {
    return (
      <div className="clay-card rounded-3xl p-8 text-center text-[#45483F]">
        Loading city telemetry...
      </div>
    );
  }

  const p = selectedCity.pollutants;
  const primaryPollutant = p.pm25 >= p.pm10 * 0.6 ? 'PM2.5' : 'PM10';

  const pollutantCards = [
    { name: 'PM2.5', sub: 'Fine Dust', value: p.pm25, unit: 'µg/m³', limit: 60, max: 250 },
    { name: 'PM10', sub: 'Coarse Dust', value: p.pm10, unit: 'µg/m³', limit: 100, max: 400 },
    { name: 'NO₂', sub: 'Vehicular', value: p.no2, unit: 'µg/m³', limit: 80, max: 150 },
    { name: 'SO₂', sub: 'Industrial', value: p.so2, unit: 'µg/m³', limit: 80, max: 100 },
    { name: 'CO', sub: 'Carbon Monox.', value: p.co, unit: 'mg/m³', limit: 2.0, max: 5.0 },
    { name: 'O₃', sub: 'Ground Ozone', value: p.o3, unit: 'µg/m³', limit: 100, max: 120 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="clay-card rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-[#606C38] text-[#FEFAE0] flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="city-select" className="sr-only">
                  Select Indian City
                </label>
                <div className="relative inline-flex items-center max-w-full">
                  <select
                    id="city-select"
                    value={selectedCity.city}
                    onChange={(e) => onSelectCity(e.target.value)}
                    className="appearance-none bg-transparent pr-7 font-display text-lg sm:text-xl font-bold text-[#283618] focus:outline-none cursor-pointer truncate"
                  >
                    {cities.map((c) => (
                      <option key={c.city} value={c.city}>
                        {c.city} · {c.station}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#283618] pointer-events-none -ml-5" />
                </div>
                <p className="text-xs text-[#45483F] mt-0.5 truncate">{selectedCity.date}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh city telemetry"
              className="w-11 h-11 rounded-xl clay-inset flex items-center justify-center text-[#283618] hover:bg-[#E7E3CA] transition-colors shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
            <div className="clay-card rounded-2xl p-3.5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl clay-inset flex items-center justify-center text-[#606C38] shrink-0">
                <Thermometer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#45483F]">Temp</p>
                <p className="font-mono-tabular text-base font-bold text-[#283618]">
                  {selectedCity.weather.temp_c}°C
                </p>
              </div>
            </div>
            <div className="clay-card rounded-2xl p-3.5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl clay-inset flex items-center justify-center text-[#606C38] shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#45483F]">Humidity</p>
                <p className="font-mono-tabular text-base font-bold text-[#283618]">
                  {selectedCity.weather.humidity_pct}%
                </p>
              </div>
            </div>
            <div className="clay-card rounded-2xl p-3.5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl clay-inset flex items-center justify-center text-[#606C38] shrink-0">
                <Wind className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#45483F]">Wind</p>
                <p className="font-mono-tabular text-base font-bold text-[#283618] truncate">
                  {selectedCity.weather.wind_kmh} km/h
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-3xl overflow-hidden clay-card p-1 min-h-[140px]">
          <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-[#283618]">
            {!imgError && (
              <img
                src="/src/assets/images/delhi_haze_skyline_1795104968061.jpg"
                alt="Atmospheric haze over Indian urban skyline"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover min-h-[140px]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#283618]/85 via-[#283618]/45 to-transparent flex flex-col justify-end p-5">
              <h2 className="font-display text-lg font-bold text-[#FEFAE0]">
                {selectedCity.city} Air Quality
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <AqiGauge
            aqi={selectedCity.aqi}
            category={selectedCity.category}
            primaryPollutant={primaryPollutant}
            healthAlert={selectedCity.alert}
          />
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#283618]">
              Pollutant Breakdown
            </h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#606C38] whitespace-nowrap">
              24h CPCB Averages
            </span>
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {pollutantCards.map((item) => {
              const ratio = item.value / item.limit;
              const pct = Math.min(100, Math.max(8, (item.value / item.max) * 100));
              const isPrimary = item.name === primaryPollutant;
              const badgeColor =
                ratio <= 0.7
                  ? 'bg-[#606C38] text-[#FEFAE0]'
                  : ratio <= 1.5
                    ? 'bg-[#DDA15E] text-[#283618]'
                    : 'bg-[#BC6C25] text-[#FEFAE0]';
              const barColor =
                ratio <= 0.7
                  ? 'bg-[#DBE9A9]'
                  : ratio <= 1.5
                    ? 'bg-[#DDA15E]'
                    : 'bg-gradient-to-r from-[#DDA15E] to-[#BC6C25]';
              const label =
                ratio <= 0.7
                  ? 'Good'
                  : ratio <= 1.5
                    ? 'Moderate'
                    : `${ratio.toFixed(1)}x Limit`;

              return (
                <article
                  key={item.name}
                  className={`clay-card-olive rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between gap-3.5 transition-transform duration-150 ${
                    isPrimary ? 'ring-1 ring-[#DDA15E]/70' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-[#FEFAE0] leading-tight">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#BBCDA3] mt-0.5 truncate">{item.sub}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${badgeColor}`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline">
                      <span className="font-mono-tabular text-3xl font-bold text-[#FEFAE0] tracking-tight">
                        {item.name === 'CO' ? item.value.toFixed(1) : Math.round(item.value)}
                      </span>
                      <span className="text-xs font-medium text-[#BBCDA3] ml-1.5">
                        {item.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#BBCDA3]">
                      <span>CPCB Limit</span>
                      <span className="font-mono-tabular font-semibold text-[#DBE9A9]">
                        {item.limit} {item.unit}
                      </span>
                    </div>
                    <div className="w-full clay-inset-dark rounded-full h-2.5 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="clay-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold text-[#283618]">
                Hourly Forecast
              </h3>
              <button
                type="button"
                onClick={onOpenPredictor}
                className="text-xs font-semibold text-[#BC6C25] hover:underline"
              >
                Open Predictor →
              </button>
            </div>
            <div className="grid grid-cols-2 min-[420px]:grid-cols-5 gap-2.5">
              {selectedCity.hourly_forecast.map((slot) => {
                const slotColor =
                  slot.category === 'Good'
                    ? 'text-[#606C38] bg-[#606C38]'
                    : slot.category === 'Moderate'
                      ? 'text-[#BC6C25] bg-[#DDA15E]'
                      : slot.category === 'Poor'
                        ? 'text-[#BC6C25] bg-[#BC6C25]'
                        : 'text-[#BA1A1A] bg-[#BA1A1A]';
                const [textCls, barCls] = slotColor.split(' ');
                return (
                  <div
                    key={slot.time}
                    className="clay-inset rounded-xl py-2.5 px-2 flex flex-col items-center gap-1"
                  >
                    <span className="text-[11px] font-medium text-[#45483F]">{slot.time}</span>
                    <span className={`font-mono-tabular text-base font-bold ${textCls}`}>
                      {slot.aqi}
                    </span>
                    <div className="w-full px-1">
                      <div className={`h-1.5 rounded-full ${barCls}`} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${textCls}`}>
                      {slot.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
