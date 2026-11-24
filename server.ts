import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { aqiEngine } from './src/ml/aqiEngine';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json());

  app.get('/api/cities', (_req, res) => {
    res.json({ cities: aqiEngine.getCities() });
  });

  app.post('/api/predict', (req, res) => {
    const body = req.body ?? {};
    const pm25 = Number(body.pm25);
    const pm10 = Number(body.pm10);
    const no2 = Number(body.no2);
    const so2 = Number(body.so2);
    const co = Number(body.co);
    const o3 = Number(body.o3);

    if ([pm25, pm10, no2, so2, co, o3].some((v) => Number.isNaN(v))) {
      res.status(400).json({ error: 'All pollutant values must be numeric.' });
      return;
    }

    const prediction = aqiEngine.predict({ pm25, pm10, no2, so2, co, o3 });
    res.json(prediction);
  });

  app.get('/api/analytics', (req, res) => {
    const city = typeof req.query.city === 'string' ? req.query.city : 'Delhi';
    res.json(aqiEngine.getAnalytics(city));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`VayuTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
