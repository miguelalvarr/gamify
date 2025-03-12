import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// En ES modules, __dirname no está disponible, así que lo creamos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Servir archivos estáticos desde el directorio dist
app.use(express.static(path.join(__dirname, 'dist')));

// Ruta para el health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Para todas las demás rutas, sirve index.html para permitir que React Router funcione
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});