/**
 * Sistema de recuperación de autenticación para prevenir pantalla blanca
 * Este código detecta cuando la aplicación está "atascada" en un estado de carga
 * y fuerza una redirección a la página de login para recuperar la funcionalidad
 */

export const setupAuthRecovery = () => {
  // Tiempo máximo que esperaremos antes de considerar que hay un problema (5 segundos)
  const MAX_LOADING_TIME = 5000;
  let authRecoveryTimer = null;
  
  // Detectar cuando la página ha cargado completamente
  window.addEventListener('load', () => {
    console.log('AuthRecovery: Página cargada, iniciando temporizador de seguridad');
    
    // Iniciar temporizador de seguridad
    authRecoveryTimer = setTimeout(() => {
      // Verificar si la interfaz parece atascada (elemento con id "app-loaded" no existe)
      const isAppLoaded = document.getElementById('app-loaded');
      
      if (!isAppLoaded) {
        console.log('AuthRecovery: Posible pantalla blanca detectada, intentando recuperar');
        
        // Limpiar localStorage completamente como último recurso
        try {
          // Guarda el hash actual primero
          const currentHash = window.location.hash;
          
          // Guardar en sessionStorage (que sobrevive a redirecciones pero no a cierres de ventana)
          if (currentHash && currentHash !== '#/' && currentHash !== '#') {
            sessionStorage.setItem('recovery_route', currentHash);
          }
          
          // Limpiar todo el localStorage para eliminar cualquier dato de sesión corrupto
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('supabase.auth') || key.includes('sb-')) {
              keysToRemove.push(key);
            }
          }
          
          // Eliminar las claves relacionadas con autenticación
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          console.log('AuthRecovery: Datos de autenticación eliminados');
          
          // Redirigir explícitamente a login para forzar un estado limpio
          window.location.href = window.location.origin + '/#/login?recovery=true';
        } catch (error) {
          console.error('AuthRecovery: Error limpiando datos:', error);
        }
      } else {
        console.log('AuthRecovery: La aplicación parece haber cargado correctamente');
      }
    }, MAX_LOADING_TIME);
  });
  
  // Si la aplicación carga correctamente, cancelar el temporizador
  const markAppAsLoaded = () => {
    console.log('AuthRecovery: Marcando la aplicación como cargada');
    
    // Crear elemento oculto para indicar que la app está cargada
    if (!document.getElementById('app-loaded')) {
      const loadedMarker = document.createElement('div');
      loadedMarker.id = 'app-loaded';
      loadedMarker.style.display = 'none';
      document.body.appendChild(loadedMarker);
    }
    
    // Cancelar el temporizador si existe
    if (authRecoveryTimer) {
      clearTimeout(authRecoveryTimer);
      authRecoveryTimer = null;
    }
  };
  
  // Verificar si hay una ruta guardada de una recuperación anterior
  const checkForRecoveryRoute = () => {
    const recoveryRoute = sessionStorage.getItem('recovery_route');
    if (recoveryRoute) {
      console.log('AuthRecovery: Detectada ruta de recuperación:', recoveryRoute);
      
      // Limpiar para no entrar en bucle
      sessionStorage.removeItem('recovery_route');
      
      // Esperar a que la autenticación esté lista antes de restaurar la ruta
      setTimeout(() => {
        // Solo restaurar si estamos en la página principal
        if (window.location.hash === '#/' || window.location.hash === '') {
          console.log('AuthRecovery: Restaurando ruta de recuperación');
          window.location.hash = recoveryRoute.startsWith('#') ? recoveryRoute.substring(1) : recoveryRoute;
        }
      }, 1000);
    }
  };
  
  return {
    markAppAsLoaded,
    checkForRecoveryRoute
  };
};
