// src/utils/pwaUtils.js

// Registrar el service worker y manejar actualizaciones
export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado exitosamente:', registration);
        
        // Manejar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('Error al registrar Service Worker:', error);
      });
  }
};

// Detectar si la app está funcionando offline
export const checkOnlineStatus = () => {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log(`App está ${status}`);
    
    // Mostrar notificación cuando vuelva la conexión
    if (status === 'online') {
      if (Notification.permission === 'granted') {
        new Notification('Conexión restaurada', {
          body: 'Ya puedes usar todas las funciones de la app',
          icon: '/logo192.png'
        });
      }
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  return updateOnlineStatus;
};

// Solicitar permisos de notificación
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};