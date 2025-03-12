// build.mjs - Script personalizado para ejecutar la compilación
import { build } from 'vite';

// Ejecutar la compilación de Vite
console.log('Iniciando proceso de compilación con Vite...');
try {
  await build();
  console.log('¡Compilación completada con éxito!');
} catch (error) {
  console.error('Error durante la compilación:', error);
  process.exit(1);
}
