import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  Factory,
  Flame,
  Sparkles,
  Wind,
} from 'lucide-react';
import type { PollutantInputs, PredictionResponse } from '../types/aqi';

interface ScenarioOption {
  id: string;
  title: string;
  icon: typeof Flame;
  accentColor: string;
  inputs: PollutantInputs;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'stubble',
    title: 'Winter Stubble Spike',
    icon: Flame,
    accentColor: 'text-[#BC6C25]',
    inputs: { pm25: 260, pm10: 380, no2: 85, so2: 35, co: 3.6, o3: 45 },
  },
  {
    id: 'diwali',
    title: 'Diwali Eve Scenario',
    icon: AlertTriangle,
    accentColor: 'text-[#BA1A1A]',
    inputs: { pm25: 410, pm10: 540, no2: 145, so2: 92, co: 6.2, o3: 75 },
  },
  {
    id: 'traffic',
    title: 'Urban Morning Traffic Peak',
    icon: Wind,
    accentColor: 'text-[#DDA15E]',
    inputs: { pm25: 140, pm10: 220, no2: 95, so2: 24, co: 2.6, o3: 52 },
  },
  {
    id: 'industrial',
    title: 'Industrial Corridor Drift',
    icon: Factory,
    accentColor: 'text-[#BC6C25]',
    inputs: { pm25: 165, pm10: 290, no2: 72, so2: 68, co: 2.1, o3: 44 },
  },
  {
    id: 'monsoon',
    title: 'Post-Monsoon Clear',
    icon: CloudRain,
    accentColor: 'text-[#606C38]',
    inputs: { pm25: 28, pm10: 45, no2: 20, so2: 8, co: 0.6, o3: 22 },
  },
];

export const PredictorView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[2].id);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SCENARIOS[0];

  const runPrediction = async (payload: PollutantInputs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PredictionResponse = await res.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction(activeScenario.inputs);
  }, []);

  const handleSelectScenario = (scenario: ScenarioOption) => {
    setSelectedScenarioId(scenario.id);
    runPrediction(scenario.inputs);
  };

  const categoryBadgeStyle =
    prediction?.category === 'Good'
      ? 'bg-[#1C3E20] border-[#606C38] text-[#DBE9A9]'
      : prediction?.category === 'Moderate'
        ? 'bg-[#4A3212] border-[#DDA15E] text-[#FFDCBB]'
        : prediction?.category === 'Poor'
          ? 'bg-[#3E2510] border-[#BC6C25] text-[#FABA75]'
          : 'bg-[#4A1414] border-[#BA1A1A] text-[#FFDAD6]';

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#283618]">
        AI AQI Predictor
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 clay-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#283618]">
            Atmospheric Scenarios
          </h2>

          <div className="space-y-2.5">
            {SCENARIOS.map((scenario) => {
              const Icon = scenario.icon;
              const isSelected = scenario.id === selectedScenarioId;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectScenario(scenario)}
                  className={`w-full text-left rounded-2xl px-4 py-3.5 transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#283618] text-[#FEFAE0] shadow-md'
                      : 'clay-inset text-[#283618] hover:bg-[#E7E3CA]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#1C2610]' : 'bg-[#FEFAE0]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#DDA15E]' : scenario.accentColor
                      }`}
                    />
                  </div>
                  <span className="font-display text-sm font-bold">{scenario.title}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => runPrediction(activeScenario.inputs)}
            className="clay-button-copper w-full py-3.5 px-5 rounded-2xl text-[#FEFAE0] font-display font-bold text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? 'Predicting...' : 'Predict AQI'}
          </button>
        </div>

        <div className="lg:col-span-6 clay-card-olive rounded-3xl p-6 text-[#FEFAE0] space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#DDA15E]">
              Predicted AQI
            </span>
            <span className="text-xs font-semibold text-[#DBE9A9]">
              {activeScenario.title}
            </span>
          </div>

          {error && (
            <div className="rounded-xl bg-[#BA1A1A]/30 border border-[#BA1A1A] p-3 text-xs text-[#FFDAD6]">
              {error}
            </div>
          )}

          {prediction && (
            <>
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-tabular text-5xl font-extrabold text-[#FEFAE0]">
                    {Math.round(prediction.predicted_aqi)}
                  </span>
                  <span className="text-xs font-semibold text-[#DDA15E]">AQI</span>
                </div>

                <span
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${categoryBadgeStyle}`}
                >
                  {prediction.category}
                </span>
              </div>

              <div className="clay-inset-dark rounded-2xl p-4 space-y-2 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#FEFAE0]">Confidence</span>
                  <span className="font-mono-tabular font-bold text-[#DDA15E]">
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#11180A] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#BC6C25] to-[#DDA15E] rounded-full transition-all duration-500"
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-[#1C2610] px-4 py-3 border border-white/10">
                <p className="text-sm font-medium text-[#FEFAE0]">{prediction.health_alert}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
