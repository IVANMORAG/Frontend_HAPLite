import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Solicitar permisos de notificación
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Ejecutar al cargar
requestNotificationPermission();

console.log('🚀 Aplicación iniciando...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)