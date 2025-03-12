// preview.mjs - Script personalizado para ejecutar el preview
import { preview } from 'vite';

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);
const hostIndex = args.indexOf('--host');
const portIndex = args.indexOf('--port');

// Configurar opciones de preview
const options = {};

// Añadir host si se especificó
if (hostIndex !== -1 && hostIndex + 1 < args.length) {
  options.host = args[hostIndex + 1];
} else if (hostIndex !== -1) {
  options.host = true; // Si --host está presente pero sin valor, usar true
}

// Añadir puerto si se especificó
if (portIndex !== -1 && portIndex + 1 < args.length) {
  options.port = parseInt(args[portIndex + 1], 10);
}

// Ejecutar el preview de Vite
console.log('Iniciando servidor de preview con Vite...');
console.log('Opciones:', options);

try {
  await preview(options);
  console.log('Servidor de preview inicializado correctamente.');
} catch (error) {
  console.error('Error al iniciar el servidor de preview:', error);
  process.exit(1);
}
