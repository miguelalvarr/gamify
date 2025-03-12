/**
 * SOLUCIÓN DEFINITIVA PARA PANTALLA BLANCA
 * Este script SOLO se activa cuando hay una pantalla blanca real,
 * no interfiere con ninguna funcionalidad normal como el registro
 */
 
(function() {
  // Solo ejecutar cuando la página ya ha cargado completamente
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    runDetection();
  } else {
    window.addEventListener('DOMContentLoaded', runDetection);
  }
  
  function runDetection() {
    // Solo verificar DESPUÉS de que React haya tenido tiempo de renderizar
    setTimeout(function() {
      const isBlankScreen = isScreenBlank();
      
      // Solo hacer algo si realmente tenemos una pantalla blanca
      if (isBlankScreen) {
        console.log("⚠️ PANTALLA BLANCA DETECTADA - Recuperando aplicación");
        recoverFromBlankScreen();
      }
    }, 2000); // Esperar 2 segundos
  }
  
  // Detecta si realmente hay una pantalla blanca
  function isScreenBlank() {
    const root = document.getElementById('root');
    
    // Verificar que el div root existe pero no tiene contenido visible
    if (!root || root.children.length === 0) {
      // Verificar que no estamos en una página de registro
      return !window.location.hash.includes('/register') && 
             !window.location.hash.includes('/signup') &&
             !window.location.hash.includes('/crear-cuenta');
    }
    
    return false;
  }
  
  // Recupera la aplicación eliminando datos de sesión corruptos
  function recoverFromBlankScreen() {
    try {
      // Limpiar solo los datos de sesión de Supabase
      let tokensRemoved = 0;
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
          tokensRemoved++;
        }
      });
      
      console.log(`🧹 Se han eliminado ${tokensRemoved} tokens de sesión potencialmente corruptos`);
      
      // Redirigir a la página de login
      window.location.href = '/#/login?recovered=true';
    } catch (error) {
      console.error("Error al recuperar la aplicación:", error);
    }
  }
})();
