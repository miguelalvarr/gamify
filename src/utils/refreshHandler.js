/**
 * Script para manejar el problema de pantalla en blanco al refrescar la página
 * Este script se encarga de guardar el estado de la URL antes de refrescar
 * y restaurarlo después del refrescar la página
 */

export const setupRefreshHandler = () => {
  // Al iniciar la aplicación, comprobar si estamos en una URL guardada
  const savedPath = sessionStorage.getItem('lastPath');
  const savedSearch = sessionStorage.getItem('lastSearch');
  const currentPath = window.location.pathname;
  
  // Si hay una ruta guardada y estamos en la ruta raíz (después de refrescar),
  // redirigir a la ruta guardada
  if (savedPath && currentPath === '/') {
    const redirectUrl = savedPath + (savedSearch || '');
    setTimeout(() => {
      window.history.pushState(null, '', redirectUrl);
    }, 100);
    
    // Limpiar después de usar
    sessionStorage.removeItem('lastPath');
    sessionStorage.removeItem('lastSearch');
  }
  
  // Guardar la ruta actual antes de cada recarga de página
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('lastPath', window.location.pathname);
    sessionStorage.setItem('lastSearch', window.location.search);
  });
};
