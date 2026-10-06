import { createApp } from './app.js';
import { PORT } from './config.js';
import { initDB } from './db/database.js';

initDB();
const app = createApp();

app.listen(PORT, () => {
  console.log(`Servidor FitTrack Backend REST ejecutándose en http://localhost:${PORT}`);
  console.log(`Comprobación de salud disponible en http://localhost:${PORT}/api/health`);
});
