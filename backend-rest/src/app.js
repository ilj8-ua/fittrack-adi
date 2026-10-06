import express from 'express';
import cors from 'cors';
import { getDB } from './db/database.js';

export function createApp(dbInstance = null) {
  const app = express();

  // Asegurar que la base de datos está inicializada
  if (dbInstance) {
    // Si se pasa una instancia de prueba (ej. :memory:)
  } else {
    getDB();
  }

  // Middlewares globales
  app.use(cors());
  app.use(express.json());

  // Log simple de peticiones
  app.use((req, res, next) => {
    // Middleware de logging de peticiones
    next();
  });

  // Ruta de salud de la API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'FitTrack API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Manejo de rutas no encontradas 404
  app.use((req, res, next) => {
    if (res.headersSent) return next();
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejador centralizado de errores 500
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error('Error no controlado en backend REST:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

export default createApp;
