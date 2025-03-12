// Solución para el problema de pantalla blanca en Gamify
// Este script debe ejecutarse en la consola del navegador cuando tengas una pantalla blanca

(() => {
  console.log('🔄 Iniciando recuperación de emergencia para pantalla blanca...');
  
  // 1. Eliminar todas las claves de Supabase en localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      console.log(`🗑️ Eliminando clave: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // 2. Limpiar sessionStorage por si acaso
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      console.log(`🗑️ Eliminando clave de sessionStorage: ${key}`);
      sessionStorage.removeItem(key);
    }
  });
  
  // 3. Forzar redirección a login
  console.log('✅ Datos de autenticación limpiados. Redirigiendo a login...');
  window.location.href = '/#/login';
})();
