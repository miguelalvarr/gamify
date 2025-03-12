/**
 * Script para manejar el problema de pantalla en blanco al refrescar la página
 * Este script se encarga de guardar el estado de la URL antes de refrescar
 * y restaurarlo después del refrescar la página
 * 
 * Versión optimizada para HashRouter
 */

export const setupRefreshHandler = () => {
  // Al iniciar la aplicación, comprobar si tenemos una ruta guardada
  const savedHash = sessionStorage.getItem('lastHash');
  
  // Si hay un hash guardado y estamos en una página recién cargada sin hash
  if (savedHash && window.location.hash === '') {
    setTimeout(() => {
      // Restaurar el hash guardado (que incluye la ruta completa)
      window.location.hash = savedHash.startsWith('#') ? savedHash.substring(1) : savedHash;
      console.log('Ruta restaurada después de refrescar:', window.location.hash);
    }, 100);
    
    // Limpiar después de usar
    sessionStorage.removeItem('lastHash');
  }
  
  // Guardar el hash actual antes de cada recarga de página
  window.addEventListener('beforeunload', () => {
    // Guardar el hash completo sin el símbolo # inicial
    const currentHash = window.location.hash;
    if (currentHash && currentHash !== '#/' && currentHash !== '#') {
      sessionStorage.setItem('lastHash', currentHash);
      console.log('Ruta guardada antes de refrescar:', currentHash);
    }
  });
};
