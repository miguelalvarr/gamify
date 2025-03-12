// preview-fixed.mjs - Script mejorado para ejecutar el preview
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Función principal
async function startServer() {
  try {
    // Priorizar variable de entorno PORT (usada por Render)
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;
    const host = '0.0.0.0'; // Siempre usar 0.0.0.0 para asegurarnos que está accesible
    
    console.log(`Iniciando servidor en http://${host}:${port}`);
    
    // Verifica si existe el directorio dist (construido)
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('¡ERROR: El directorio dist no existe! Ejecuta npm run build primero.');
      process.exit(1);
    }
    
    // Crea el servidor Vite en modo preview
    const server = await createServer({
      base: './',
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.js'),
      server: {
        port: port,
        host: host,
        strictPort: true 
      },
      preview: true
    });
    
    // Inicia el servidor en modo preview
    await server.listen(port, host);
    
    console.log(`Servidor iniciado correctamente en: http://${host}:${port}/`);
    
    // Maneja señales de terminación
    const shutdown = async () => {
      console.log('\nCerrando servidor...');
      await server.close();
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
