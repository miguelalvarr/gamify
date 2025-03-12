/**
 * Solución para el problema de pantalla blanca en Gamify
 * Este módulo detecta y recupera la aplicación cuando ocurre una pantalla blanca
 */

// Función para detectar pantalla blanca por falta de renderizado de la aplicación
export const setupBlankScreenDetection = () => {
  console.log('[RECOVERY] Inicializando detector de pantalla blanca...');
  
  // Tiempo que esperamos para considerar que hay un problema (5 segundos)
  const DETECTION_TIMEOUT = 5000;
  
  // Iniciar detección después de que la página cargue
  window.addEventListener('load', () => {
    const blankScreenTimer = setTimeout(() => {
      // Verificar si el contenido ha sido renderizado
      const rootElement = document.getElementById('root');
      const hasContent = rootElement && (
        rootElement.children.length > 0 && 
        rootElement.innerHTML.trim().length > 100
      );
      
      if (!hasContent) {
        console.error('[RECOVERY] PANTALLA BLANCA DETECTADA! Iniciando recuperación de emergencia...');
        
        // Limpiar datos de autenticación que podrían estar causando el problema
        try {
          // Guardar la ruta actual para restaurarla después
          const currentRoute = window.location.hash;
          sessionStorage.setItem('recovery_route', currentRoute);
          
          // Limpiar todos los datos de Supabase del localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              console.log(`[RECOVERY] Eliminando clave potencialmente corrupta: ${key}`);
              localStorage.removeItem(key);
            }
          });
          
          // Forzar redirección al login con parámetro de recuperación
          console.log('[RECOVERY] Redirigiendo a login para nuevo inicio de sesión...');
          window.location.href = '/#/login?recovery=true';
        } catch (error) {
          console.error('[RECOVERY] Error durante la recuperación:', error);
          
          // Si la redirección falla, mostrar mensaje de error directamente en pantalla
          document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #121212; color: white; padding: 20px; text-align: center;">
              <h2>Error de carga en Gamify</h2>
              <p>La aplicación no pudo cargar correctamente. Esto generalmente ocurre por un problema con la sesión.</p>
              <button onclick="window.location.href='/#/login?clear=true'" style="margin-top: 20px; padding: 10px 20px; background: #1db954; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Reiniciar sesión
              </button>
            </div>
          `;
        }
      } else {
        console.log('[RECOVERY] Aplicación cargada correctamente, sin problemas detectados.');
      }
    }, DETECTION_TIMEOUT);
    
    // Si la aplicación carga normalmente, desactivar el detector
    const contentCheckInterval = setInterval(() => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.children.length > 0) {
        clearTimeout(blankScreenTimer);
        clearInterval(contentCheckInterval);
        console.log('[RECOVERY] Aplicación cargada correctamente, detector desactivado.');
      }
    }, 500);
  });
  
  // Verificar si estamos en proceso de recuperación
  if (window.location.href.includes('recovery=true')) {
    console.log('[RECOVERY] Modo de recuperación activo, verificando ruta guardada...');
    
    // Escuchar para detectar un login exitoso y restaurar la ruta
    const originalPath = sessionStorage.getItem('recovery_route');
    if (originalPath && originalPath !== '/#/login') {
      // Configurar un observador para detectar cuando se completa el login
      const observer = new MutationObserver(() => {
        // Si ya no estamos en login, restaurar la ruta original
        if (!window.location.hash.includes('/login')) {
          console.log(`[RECOVERY] Login exitoso detectado, restaurando ruta: ${originalPath}`);
          setTimeout(() => {
            window.location.hash = originalPath.replace('#', '');
            sessionStorage.removeItem('recovery_route');
            observer.disconnect();
          }, 500);
        }
      });
      
      // Iniciar observación
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
};
