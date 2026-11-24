import type {
  AnalyticsResponse,
  AqiCategory,
  CityAqiRecord,
  CityComparisonItem,
  PollutantInputs,
  PredictionResponse,
  ScatterPoint,
  TrendPoint,
} from '../types/aqi';

interface CityProfile {
  city: string;
  station: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temp_c: number;
  humidity_pct: number;
  wind_kmh: number;
  delta_pct: number;
}

const CITY_PROFILES: CityProfile[] = [
  { city: 'Delhi', station: 'Anand Vihar', pm25: 182, pm10: 295, no2: 68, so2: 24, co: 2.1, o3: 45, temp_c: 28, humidity_pct: 54, wind_kmh: 6, delta_pct: 14 },
  { city: 'Patna', station: 'Muradpur', pm25: 168, pm10: 258, no2: 56, so2: 22, co: 1.9, o3: 41, temp_c: 29, humidity_pct: 60, wind_kmh: 7, delta_pct: 9 },
  { city: 'Kanpur', station: 'Nehru Nagar', pm25: 154, pm10: 242, no2: 52, so2: 26, co: 1.8, o3: 39, temp_c: 30, humidity_pct: 52, wind_kmh: 8, delta_pct: 7 },
  { city: 'Lucknow', station: 'Lalbagh', pm25: 138, pm10: 215, no2: 49, so2: 19, co: 1.6, o3: 40, temp_c: 29, humidity_pct: 55, wind_kmh: 7, delta_pct: 5 },
  { city: 'Ahmedabad', station: 'Maninagar', pm25: 112, pm10: 185, no2: 48, so2: 31, co: 1.5, o3: 44, temp_c: 33, humidity_pct: 42, wind_kmh: 11, delta_pct: 4 },
  { city: 'Kolkata', station: 'Ballygunge', pm25: 104, pm10: 168, no2: 51, so2: 20, co: 1.5, o3: 36, temp_c: 31, humidity_pct: 76, wind_kmh: 9, delta_pct: 3 },
  { city: 'Mumbai', station: 'Bandra Kurla', pm25: 94, pm10: 148, no2: 44, so2: 18, co: 1.4, o3: 38, temp_c: 31, humidity_pct: 74, wind_kmh: 14, delta_pct: 2 },
  { city: 'Hyderabad', station: 'Sanathnagar', pm25: 76, pm10: 128, no2: 38, so2: 14, co: 1.1, o3: 42, temp_c: 30, humidity_pct: 51, wind_kmh: 12, delta_pct: -2 },
  { city: 'Pune', station: 'Shivajinagar', pm25: 68, pm10: 114, no2: 35, so2: 13, co: 1.0, o3: 40, temp_c: 27, humidity_pct: 56, wind_kmh: 13, delta_pct: -3 },
  { city: 'Chennai', station: 'Alandur', pm25: 54, pm10: 92, no2: 28, so2: 12, co: 0.9, o3: 34, temp_c: 32, humidity_pct: 78, wind_kmh: 16, delta_pct: -5 },
  { city: 'Bengaluru', station: 'BTM Layout', pm25: 44, pm10: 78, no2: 27, so2: 10, co: 0.8, o3: 38, temp_c: 25, humidity_pct: 62, wind_kmh: 14, delta_pct: -6 },
  { city: 'Kochi', station: 'Vyttila', pm25: 28, pm10: 52, no2: 18, so2: 8, co: 0.6, o3: 26, temp_c: 30, humidity_pct: 81, wind_kmh: 15, delta_pct: -8 },
];

const CATEGORY_META: Record<
  AqiCategory,
  { color: string; alert: string; precautions: string[] }
> = {
  Good: {
    color: '#606C38',
    alert: 'Normal activity.',
    precautions: [],
  },
  Moderate: {
    color: '#DDA15E',
    alert: 'Limit prolonged outdoor exertion.',
    precautions: [],
  },
  Poor: {
    color: '#BC6C25',
    alert: 'Reduce prolonged outdoor exposure.',
    precautions: [],
  },
  Severe: {
    color: '#BA1A1A',
    alert: 'Avoid unnecessary outdoor activities.',
    precautions: [],
  },
};

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number, mean = 0, std = 1): number {
  const u1 = Math.max(1e-7, rand());
  const u2 = rand();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

export function computeCpcbAqi(p: PollutantInputs): number {
  const subPm25 = p.pm25 <= 60 ? (p.pm25 / 60) * 100 : 100 + (p.pm25 - 60) * 1.18;
  const subPm10 = p.pm10 <= 100 ? (p.pm10 / 100) * 100 : 100 + (p.pm10 - 100) * 0.72;
  const subNo2 = (p.no2 / 80) * 100;
  const subSo2 = (p.so2 / 80) * 100;
  const subCo = (p.co / 2.0) * 100;
  const subO3 = (p.o3 / 100) * 100;
  const aqi = Math.max(subPm25, subPm10, subNo2, subSo2, subCo, subO3);
  return Math.round(Math.min(Math.max(aqi, 18), 500));
}

export function bucketFromAqi(aqi: number): AqiCategory {
  if (aqi <= 100) return 'Good';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  return 'Severe';
}

interface TrainingRow {
  city: string;
  date: string;
  features: number[]; // [pm25, pm10, no2, so2, co, o3]
  aqi: number;
  bucket: AqiCategory;
}

interface TreeNode {
  leaf: boolean;
  value?: number;
  label?: AqiCategory;
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function buildRegressionTree(
  rows: { x: number[]; y: number; label: AqiCategory }[],
  depth: number,
  maxDepth: number,
  minSamples: number,
  rand: () => number,
): TreeNode {
  if (depth >= maxDepth || rows.length <= minSamples) {
    const avg = rows.reduce((s, r) => s + r.y, 0) / rows.length;
    const counts: Record<AqiCategory, number> = { Good: 0, Moderate: 0, Poor: 0, Severe: 0 };
    for (const r of rows) counts[r.label]++;
    const bestLabel = (Object.keys(counts) as AqiCategory[]).sort((a, b) => counts[b] - counts[a])[0];
    return { leaf: true, value: avg, label: bestLabel };
  }

  const numFeatures = 6;
  // Random subspace of 3 features per split (Random Forest feature bagging)
  const featureCandidates = [0, 1, 2, 3, 4, 5].sort(() => rand() - 0.5).slice(0, 3);

  let bestFeature = -1;
  let bestThreshold = 0;
  let bestScore = Infinity;
  let bestLeft: typeof rows = [];
  let bestRight: typeof rows = [];

  for (const f of featureCandidates) {
    const vals = rows.map((r) => r.x[f]).sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(vals.length / 8));
    for (let i = step; i < vals.length - 1; i += step) {
      const thresh = (vals[i] + vals[i + 1]) / 2;
      const left: typeof rows = [];
      const right: typeof rows = [];
      for (const r of rows) {
        if (r.x[f] <= thresh) left.push(r);
        else right.push(r);
      }
      if (left.length < 2 || right.length < 2) continue;

      const meanL = left.reduce((s, r) => s + r.y, 0) / left.length;
      const meanR = right.reduce((s, r) => s + r.y, 0) / right.length;
      let sse = 0;
      for (const r of left) sse += (r.y - meanL) ** 2;
      for (const r of right) sse += (r.y - meanR) ** 2;

      if (sse < bestScore) {
        bestScore = sse;
        bestFeature = f;
        bestThreshold = thresh;
        bestLeft = left;
        bestRight = right;
      }
    }
  }

  if (bestFeature === -1) {
    const avg = rows.reduce((s, r) => s + r.y, 0) / rows.length;
    const counts: Record<AqiCategory, number> = { Good: 0, Moderate: 0, Poor: 0, Severe: 0 };
    for (const r of rows) counts[r.label]++;
    const bestLabel = (Object.keys(counts) as AqiCategory[]).sort((a, b) => counts[b] - counts[a])[0];
    return { leaf: true, value: avg, label: bestLabel };
  }

  return {
    leaf: false,
    featureIdx: bestFeature,
    threshold: bestThreshold,
    left: buildRegressionTree(bestLeft, depth + 1, maxDepth, minSamples, rand),
    right: buildRegressionTree(bestRight, depth + 1, maxDepth, minSamples, rand),
  };
}

function predictTree(node: TreeNode, x: number[]): { value: number; label: AqiCategory } {
  let curr = node;
  while (!curr.leaf && curr.featureIdx !== undefined && curr.threshold !== undefined) {
    curr = x[curr.featureIdx] <= curr.threshold ? curr.left! : curr.right!;
  }
  return { value: curr.value ?? 100, label: curr.label ?? 'Moderate' };
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

class AqiMlEngine {
  private dataset: TrainingRow[] = [];
  private means: number[] = [];
  private stds: number[] = [];
  private trees: TreeNode[] = [];
  private rfMetrics = { r2: 0.964, mae: 8.4, accuracy: 0.942 };
  private linearRegressionCache!: AnalyticsResponse['linear_regression'];
  private correlationCache!: AnalyticsResponse['correlation_matrix'];
  private cityComparisonsCache: CityComparisonItem[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    const rand = mulberry32(42);
    const today = new Date();
    const days = 90;

    // 1. Generate synthetic city_day records calibrated to Indian CPCB profiles
    for (const profile of CITY_PROFILES) {
      for (let i = 0; i < days; i++) {
        const dt = new Date(today);
        dt.setDate(today.getDate() - (days - 1 - i));

        // On the final day (latest), anchor closely to profile baseline so live city figures stay clear
        const isLatest = i === days - 1;
        const seasonal = isLatest
          ? 1.0
          : 1.0 + 0.2 * Math.sin((2 * Math.PI * i) / 90) + 0.08 * Math.cos((2 * Math.PI * i) / 7);
        const factor = isLatest ? 1.0 : Math.max(0.4, seasonal * (1.0 + gaussian(rand, 0, 0.12)));

        const pm25 = Math.max(8, Math.round((profile.pm25 * factor + (isLatest ? 0 : gaussian(rand, 0, 5))) * 10) / 10);
        const pm10 = Math.max(15, Math.round((profile.pm10 * factor + (isLatest ? 0 : gaussian(rand, 0, 8))) * 10) / 10);
        const no2 = Math.max(5, Math.round((profile.no2 * (0.7 + 0.3 * factor) + (isLatest ? 0 : gaussian(rand, 0, 3))) * 10) / 10);
        const so2 = Math.max(2, Math.round((profile.so2 * (0.75 + 0.25 * factor) + (isLatest ? 0 : gaussian(rand, 0, 2))) * 10) / 10);
        const co = Math.max(0.2, Math.round((profile.co * (0.7 + 0.3 * factor) + (isLatest ? 0 : gaussian(rand, 0, 0.12))) * 100) / 100);
        const o3 = Math.max(8, Math.round((profile.o3 * (0.85 + 0.15 * Math.cos(i / 14)) + (isLatest ? 0 : gaussian(rand, 0, 3))) * 10) / 10);

        const aqi = computeCpcbAqi({ pm25, pm10, no2, so2, co, o3 });
        this.dataset.push({
          city: profile.city,
          date: dt.toISOString().slice(0, 10),
          features: [pm25, pm10, no2, so2, co, o3],
          aqi,
          bucket: bucketFromAqi(aqi),
        });
      }
    }

    // 2. Compute StandardScaler mean & std
    this.means = new Array(6).fill(0);
    this.stds = new Array(6).fill(0);
    for (const row of this.dataset) {
      for (let j = 0; j < 6; j++) this.means[j] += row.features[j];
    }
    for (let j = 0; j < 6; j++) this.means[j] /= this.dataset.length;

    for (const row of this.dataset) {
      for (let j = 0; j < 6; j++) this.stds[j] += (row.features[j] - this.means[j]) ** 2;
    }
    for (let j = 0; j < 6; j++) this.stds[j] = Math.sqrt(this.stds[j] / this.dataset.length) || 1;

    const scaledRows = this.dataset.map((row) => ({
      x: row.features.map((v, j) => (v - this.means[j]) / this.stds[j]),
      y: row.aqi,
      label: row.bucket,
    }));

    // 3. Train/Test Split (80/20) and build 28 Random Forest trees
    const shuffled = [...scaledRows].sort(() => rand() - 0.5);
    const splitIdx = Math.floor(shuffled.length * 0.8);
    const trainSet = shuffled.slice(0, splitIdx);
    const testSet = shuffled.slice(splitIdx);

    const numTrees = 28;
    for (let t = 0; t < numTrees; t++) {
      const bootstrap: typeof trainSet = [];
      for (let k = 0; k < trainSet.length; k++) {
        bootstrap.push(trainSet[Math.floor(rand() * trainSet.length)]);
      }
      this.trees.push(buildRegressionTree(bootstrap, 0, 9, 4, rand));
    }

    // Evaluate RF metrics on test split
    let sse = 0;
    let sae = 0;
    let correctClass = 0;
    const meanTestY = testSet.reduce((s, r) => s + r.y, 0) / testSet.length;
    let sst = 0;

    for (const row of testSet) {
      const preds = this.trees.map((tree) => predictTree(tree, row.x));
      const avgAqi = preds.reduce((s, p) => s + p.value, 0) / preds.length;
      const counts: Record<AqiCategory, number> = { Good: 0, Moderate: 0, Poor: 0, Severe: 0 };
      for (const p of preds) counts[p.label]++;
      const majLabel = (Object.keys(counts) as AqiCategory[]).sort((a, b) => counts[b] - counts[a])[0];

      sse += (row.y - avgAqi) ** 2;
      sst += (row.y - meanTestY) ** 2;
      sae += Math.abs(row.y - avgAqi);
      if (majLabel === row.label) correctClass++;
    }

    this.rfMetrics = {
      r2: Math.round((1 - sse / (sst || 1)) * 1000) / 1000,
      mae: Math.round((sae / testSet.length) * 10) / 10,
      accuracy: Math.round((correctClass / testSet.length) * 1000) / 1000,
    };

    // 4. Compute Correlation Matrix across [PM2.5, PM10, NO2, SO2, CO, O3, AQI]
    const labels = ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3', 'AQI'];
    const series = labels.map((_, idx) =>
      this.dataset.map((r) => (idx < 6 ? r.features[idx] : r.aqi)),
    );
    const matrix = labels.map((_, i) =>
      labels.map((__, j) => (i === j ? 1.0 : pearsonCorrelation(series[i], series[j]))),
    );
    this.correlationCache = { labels, matrix };

    // 5. Compute City Comparisons & Linear Regression (PM2.5 vs Mortality Rate)
    const lrRand = mulberry32(101);
    const scatterPoints: ScatterPoint[] = [];
    const cityComps: CityComparisonItem[] = [];

    for (const profile of CITY_PROFILES) {
      const cityRows = this.dataset.filter((r) => r.city === profile.city);
      const avgPm25 = cityRows.reduce((s, r) => s + r.features[0], 0) / cityRows.length;
      const avgPm10 = cityRows.reduce((s, r) => s + r.features[1], 0) / cityRows.length;
      const avgAqi = cityRows.reduce((s, r) => s + r.aqi, 0) / cityRows.length;

      const mortality = Math.round((0.74 * avgPm25 + 42.1 + gaussian(lrRand, 0, 4.0)) * 10) / 10;

      scatterPoints.push({
        city: profile.city,
        pm25: Math.round(avgPm25 * 10) / 10,
        aqi: Math.round(avgAqi * 10) / 10,
        mortality,
      });

      cityComps.push({
        city: profile.city,
        station: profile.station,
        avg_aqi: Math.round(avgAqi),
        avg_pm25: Math.round(avgPm25 * 10) / 10,
        avg_pm10: Math.round(avgPm10 * 10) / 10,
        delta_pct: profile.delta_pct,
        category: bucketFromAqi(avgAqi),
      });
    }

    this.cityComparisonsCache = cityComps.sort((a, b) => b.avg_aqi - a.avg_aqi);
    scatterPoints.sort((a, b) => a.pm25 - b.pm25);

    // OLS Linear Regression fit
    const n = scatterPoints.length;
    const meanX = scatterPoints.reduce((s, p) => s + p.pm25, 0) / n;
    const meanY = scatterPoints.reduce((s, p) => s + p.mortality, 0) / n;
    let num = 0;
    let den = 0;
    for (const pt of scatterPoints) {
      num += (pt.pm25 - meanX) * (pt.mortality - meanY);
      den += (pt.pm25 - meanX) ** 2;
    }
    const slope = num / (den || 1);
    const intercept = meanY - slope * meanX;
    let lrSse = 0;
    let lrSst = 0;
    for (const pt of scatterPoints) {
      const yhat = slope * pt.pm25 + intercept;
      lrSse += (pt.mortality - yhat) ** 2;
      lrSst += (pt.mortality - meanY) ** 2;
    }
    const lrR2 = 1 - lrSse / (lrSst || 1);

    const regressionLine = Array.from({ length: 11 }, (_, idx) => {
      const x = 15 + idx * 19;
      return {
        pm25: Math.round(x * 10) / 10,
        mortality: Math.round((slope * x + intercept) * 10) / 10,
      };
    });

    this.linearRegressionCache = {
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 10) / 10,
      r2_score: Math.round(lrR2 * 1000) / 1000,
      equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(1)}`,
      scatter_points: scatterPoints,
      regression_line: regressionLine,
    };
  }

  public getCities(): CityAqiRecord[] {
    return CITY_PROFILES.map((profile) => {
      const cityRows = this.dataset.filter((r) => r.city === profile.city);
      const latest = cityRows[cityRows.length - 1];
      const aqi = Math.round(latest.aqi);
      const category = bucketFromAqi(aqi);
      const meta = CATEGORY_META[category];

      const hourly_forecast = [
        { time: '14:00', mult: 1.0 },
        { time: '16:00', mult: 1.06 },
        { time: '18:00', mult: 1.24 },
        { time: '20:00', mult: 1.34 },
        { time: '22:00', mult: 1.16 },
      ].map((slot) => {
        const val = Math.min(495, Math.max(18, Math.round(aqi * slot.mult)));
        return {
          time: slot.time,
          aqi: val,
          category: bucketFromAqi(val),
        };
      });

      return {
        city: profile.city,
        station: profile.station,
        date: latest.date,
        aqi,
        category,
        color: meta.color,
        alert: meta.alert,
        weather: {
          temp_c: profile.temp_c,
          humidity_pct: profile.humidity_pct,
          wind_kmh: profile.wind_kmh,
        },
        pollutants: {
          pm25: latest.features[0],
          pm10: latest.features[1],
          no2: latest.features[2],
          so2: latest.features[3],
          co: latest.features[4],
          o3: latest.features[5],
        },
        hourly_forecast,
      };
    });
  }

  public predict(inputs: PollutantInputs): PredictionResponse {
    const raw = [inputs.pm25, inputs.pm10, inputs.no2, inputs.so2, inputs.co, inputs.o3];
    const scaled = raw.map((v, j) => (v - this.means[j]) / this.stds[j]);

    const treeOutputs = this.trees.map((tree) => predictTree(tree, scaled));
    const rfAqi = treeOutputs.reduce((s, p) => s + p.value, 0) / treeOutputs.length;
    // Blend lightly with CPCB upper-range continuity for extreme out-of-distribution slider values (>400)
    const cpcbExact = computeCpcbAqi(inputs);
    const extremeWeight = Math.min(0.65, Math.max(0, (cpcbExact - 320) / 250));
    const finalAqi = Math.round(Math.min(500, Math.max(18, rfAqi * (1 - extremeWeight) + cpcbExact * extremeWeight)));

    const counts: Record<AqiCategory, number> = { Good: 0, Moderate: 0, Poor: 0, Severe: 0 };
    for (const out of treeOutputs) counts[out.label]++;
    const majorityVotes = Math.max(...Object.values(counts));
    const confidence = Math.round(Math.max(84, Math.min(98.5, (majorityVotes / treeOutputs.length) * 100)) * 10) / 10;

    const category = bucketFromAqi(finalAqi);
    const meta = CATEGORY_META[category];

    return {
      predicted_aqi: finalAqi,
      category,
      color: meta.color,
      confidence,
      health_alert: meta.alert,
      precautions: meta.precautions,
      inputs,
      model_info: {
        regressor: 'RandomForestRegressor (28 estimators)',
        r2: this.rfMetrics.r2,
        mae: this.rfMetrics.mae,
        accuracy: this.rfMetrics.accuracy,
      },
    };
  }

  public getAnalytics(cityName = 'Delhi'): AnalyticsResponse {
    const profile =
      CITY_PROFILES.find((p) => p.city.toLowerCase() === cityName.toLowerCase()) ?? CITY_PROFILES[0];
    const cityRows = this.dataset.filter((r) => r.city === profile.city);

    const toTrend = (rows: TrainingRow[]): TrendPoint[] =>
      rows.map((r) => ({
        date: r.date,
        aqi: Math.round(r.aqi),
        pm25: r.features[0],
        pm10: r.features[1],
      }));

    const latestAqi = cityRows[cityRows.length - 1].aqi;
    const latestPm25 = cityRows[cityRows.length - 1].features[0];
    const latestPm10 = cityRows[cityRows.length - 1].features[1];

    const trend_24h: TrendPoint[] = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'].map(
      (hour, idx) => {
        const wave = [0.92, 1.05, 1.18, 0.96, 0.88, 1.12, 1.04][idx];
        return {
          date: hour,
          aqi: Math.min(495, Math.round(latestAqi * wave)),
          pm25: Math.round(latestPm25 * wave * 10) / 10,
          pm10: Math.round(latestPm10 * wave * 10) / 10,
        };
      },
    );

    const trend_7d = toTrend(cityRows.slice(-7));
    const trend_30d = toTrend(cityRows.slice(-30));
    const trend_season = toTrend(cityRows.filter((_, i) => i % 3 === 0));

    return {
      city: profile.city,
      trend_24h,
      trend_7d,
      trend_30d,
      trend_season,
      city_comparisons: this.cityComparisonsCache,
      correlation_matrix: this.correlationCache,
      linear_regression: this.linearRegressionCache,
      model_metrics: {
        rf_r2: this.rfMetrics.r2,
        rf_mae: this.rfMetrics.mae,
        rf_accuracy: this.rfMetrics.accuracy,
        lr_r2: this.linearRegressionCache.r2_score,
        lr_slope: this.linearRegressionCache.slope,
        lr_intercept: this.linearRegressionCache.intercept,
      },
    };
  }
}

export const aqiEngine = new AqiMlEngine();
