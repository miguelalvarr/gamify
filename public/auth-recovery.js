/**
 * SCRIPT DE RECUPERACIÓN DE EMERGENCIA PARA PANTALLA BLANCA
 * 
 * Este script se carga directamente en el HTML y se ejecuta ANTES 
 * de que cualquier problema con React o Supabase pueda ocurrir.
 * 
 * Proporciona una "red de seguridad" que detecta cuando la aplicación
 * se queda en blanco y ofrece al usuario una forma de recuperarse.
 */

(function() {
  // Solo ejecutar en navegadores
  if (typeof window === 'undefined') return;
  
  // Tiempo que esperamos para detectar si la aplicación carga correctamente
  const MAX_LOAD_TIME = 5000; // 5 segundos
  
  // Detectar si estamos ya en modo de recuperación (para evitar bucles)
  const isRecoveryMode = window.location.href.includes('recovery=true');

  // Verificar si estamos en una página de registro/signup
  const isSignupPage = window.location.hash.includes('/signup') || 
                        window.location.hash.includes('/register') ||
                        window.location.hash.includes('/crear-cuenta');
  
  // No ejecutar la recuperación en páginas de registro
  if (isSignupPage) {
    console.log('[AUTH RECOVERY]: Página de registro detectada, desactivando recuperación automática');
    return; // Salir temprano sin configurar el temporizador
  }

  // Establecer un temporizador para detectar la carga de la aplicación
  const recoveryTimeout = setTimeout(function() {
    // Si después de 5 segundos no hay contenido visible,
    // asumimos que la aplicación está atascada
    
    // Verificamos si hay elementos de React renderizados
    const appRoot = document.getElementById('root');
    const hasContent = appRoot && (
      appRoot.children.length > 0 || 
      appRoot.textContent.trim().length > 0
    );
    
    // Verificar nuevamente que no estamos en una página de signup
    // (por si la URL cambió después de cargar el script)
    const currentIsSignupPage = window.location.hash.includes('/signup') || 
                                window.location.hash.includes('/register') ||
                                window.location.hash.includes('/crear-cuenta');
    
    if (!hasContent && !isRecoveryMode && !currentIsSignupPage) {
      console.log('[AUTH RECOVERY]: Detectada posible pantalla blanca.');
      
      // Intentar limpiar datos de autenticación que podrían estar causando problemas
      try {
        // Guardar cualquier información de ruta
        const currentHash = window.location.hash;
        sessionStorage.setItem('recovery_route', currentHash);
        
        // Limpiar datos de autenticación
        Object.keys(localStorage)
          .filter(key => key.includes('supabase') || key.includes('sb-'))
          .forEach(key => localStorage.removeItem(key));
        
        console.log('[AUTH RECOVERY]: Datos de autenticación limpiados.');
        
        // Redirigir a la página principal con parámetro de recuperación
        window.location.href = window.location.origin + '/#/login?recovery=true';
      } catch (e) {
        console.error('[AUTH RECOVERY]: Error en recuperación:', e);
        
        // Si no se puede limpiar automáticamente, mostrar mensaje de recuperación manual
        document.body.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; color: white; background: #121212; text-align: center;">
            <h2>Problema al cargar la aplicación</h2>
            <p>Ha ocurrido un problema que impide cargar la aplicación correctamente.</p>
            <p>Esto suele deberse a un problema con los datos de sesión almacenados.</p>
            <div style="margin: 20px 0;">
              <button onclick="clearAndReload()" style="background: #1ed760; color: black; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">
                Reparar automáticamente
              </button>
            </div>
            <script>
              function clearAndReload() {
                // Limpiar localStorage
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key.includes('supabase') || key.includes('sb-')) {
                    localStorage.removeItem(key);
                  }
                }
                // Recargar
                window.location.href = window.location.origin + '/#/login';
              }
            </script>
          </div>
        `;
      }
    }
  }, MAX_LOAD_TIME);
  
  // Si la aplicación carga correctamente, eliminar el temporizador
  window.addEventListener('load', function() {
    // Dar un pequeño tiempo extra para que React se monte
    setTimeout(function() {
      const appRoot = document.getElementById('root');
      const hasContent = appRoot && (
        appRoot.children.length > 0 || 
        appRoot.textContent.trim().length > 0
      );
      
      if (hasContent) {
        console.log('[AUTH RECOVERY]: Aplicación cargada correctamente, desactivando recuperación.');
        clearTimeout(recoveryTimeout);
      }
    }, 1000);
  });
  
  // Si estamos en modo recuperación, verificar si hay una ruta guardada para restaurar
  if (isRecoveryMode) {
    window.addEventListener('load', function() {
      setTimeout(function() {
        const savedRoute = sessionStorage.getItem('recovery_route');
        if (savedRoute && window.location.hash.startsWith('#/login')) {
          console.log('[AUTH RECOVERY]: Se detectó una ruta guardada, se restaurará después del login.');
          
          // Configurar un observador para detectar cuando el usuario inicia sesión
          const observer = new MutationObserver(function(mutations) {
            // Si la URL cambia de login a otra cosa, asumimos que se inició sesión exitosamente
            if (!window.location.hash.startsWith('#/login')) {
              console.log('[AUTH RECOVERY]: Login detectado, restaurando ruta:', savedRoute);
              
              // Restaurar la ruta
              setTimeout(function() {
                window.location.hash = savedRoute.startsWith('#') ? savedRoute : '#' + savedRoute;
                sessionStorage.removeItem('recovery_route');
              }, 500);
              
              observer.disconnect();
            }
          });
          
          // Observar cambios en el cuerpo del documento
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }, 1000);
    });
  }
})();
