import express from 'express';
import cors from 'cors';
import { getDB } from './db/database.js';
import authRouter from './routes/auth.js';
import usuariosRouter from './routes/usuarios.js';
import rutinasRouter from './routes/rutinas.js';
import ejerciciosRouter from './routes/ejercicios.js';

export function createApp(dbInstance = null) {
  const app = express();

  // Asegurar que la base de datos está inicializada
  if (dbInstance) {
    // Si se pasa una instancia de prueba
  } else {
    getDB();
  }

  // Middlewares globales
  app.use(cors());
  app.use(express.json());

  // Ruta de salud de la API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'FitTrack API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Montaje de rutas
  app.use('/api/auth', authRouter);
  app.use('/api/usuarios', usuariosRouter);
  app.use('/api/rutinas', rutinasRouter);
  app.use('/api/ejercicios', ejerciciosRouter);

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
