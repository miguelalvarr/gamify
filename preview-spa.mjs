// preview-spa.mjs - Script para servir una aplicación SPA correctamente
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// Obtener el directorio actual
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    // Priorizar variable de entorno PORT (usada por Render)
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;
    const host = '0.0.0.0';
    
    console.log(`Iniciando servidor SPA en http://${host}:${port}`);
    
    // Verificar si existe el directorio dist
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('¡ERROR: El directorio dist no existe! Ejecuta npm run build primero.');
      process.exit(1);
    }
    
    // Crear servidor Express para servir archivos estáticos
    const app = express();
    
    // Servir archivos estáticos desde dist
    app.use(express.static(distPath));
    
    // Para cualquier ruta que no sea un archivo, servir index.html (para SPA)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    // Iniciar el servidor Express
    const server = app.listen(port, host, () => {
      console.log(`Servidor SPA iniciado correctamente en: http://${host}:${port}/`);
    });
    
    // Manejar señales de terminación
    const shutdown = () => {
      console.log('\nCerrando servidor...');
      server.close();
      process.exit(0);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
