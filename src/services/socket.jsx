import { io } from 'socket.io-client';

let socketInstance = null;
let bandwidthCallback = null;
let isSubscribed = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export const connectSocket = () => {
  console.log('[WebSocket] Iniciando conexión...');
  
  if (socketInstance && socketInstance.connected) {
    console.log('[WebSocket] Ya existe una conexión activa');
    return socketInstance;
  }

  if (socketInstance) {
    console.log('[WebSocket] Desconectando instancia previa...');
    socketInstance.disconnect();
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  console.log(`[WebSocket] Conectando a: ${apiUrl}`);

  socketInstance = io(apiUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
    forceNew: true,
    withCredentials: true
  });

  // Eventos de conexión
  socketInstance.on('connect', () => {
    console.log('[WebSocket] ✅ Conectado con éxito');
    console.log(`[WebSocket] ID: ${socketInstance.id}`);
    reconnectAttempts = 0;
    
    if (bandwidthCallback) {
      console.log('[WebSocket] Re-suscribiendo callback existente...');
      subscribeToBandwidth(bandwidthCallback);
    }
  });

  socketInstance.on('connect_error', (err) => {
    reconnectAttempts++;
    console.error('[WebSocket] ❌ Error de conexión:', err.message);
    console.log(`[WebSocket] Intento ${reconnectAttempts} de ${maxReconnectAttempts}`);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log(`[WebSocket] 🔌 Desconectado. Razón: ${reason}`);
    isSubscribed = false;
    if (reason === 'io server disconnect') {
      socketInstance.connect();
    }
  });

  // Handlers para errores y warnings del servidor
  socketInstance.on('error', (error) => {
    console.error('[WebSocket] Error del servidor:', error);
  });

  socketInstance.on('warning', (warning) => {
    console.warn('[WebSocket] Warning del servidor:', warning);
  });

  return socketInstance;
};

export const subscribeToBandwidth = (callback) => {
  console.log('[WebSocket] Suscribiendo a bandwidth...');
  
  if (typeof callback !== 'function') {
    console.error('[WebSocket] ❌ Callback no es una función');
    return;
  }

  bandwidthCallback = callback;

  if (!socketInstance) {
    console.log('[WebSocket] Inicializando nueva conexión...');
    connectSocket();
  }

  if (!socketInstance.connected) {
    console.log('[WebSocket] Esperando conexión...');
    socketInstance.once('connect', () => {
      subscribeToBandwidth(callback);
    });
    return;
  }

  // Limpiar suscripciones anteriores
  if (isSubscribed) {
    socketInstance.off('bandwidth-data');
    socketInstance.off('error');
    socketInstance.off('warning');
  }

  // Configurar opciones de suscripción
  const subscriptionOptions = {
    interval: 2000, // 2 segundos
    interfaces: [] // Vacío para recibir todas las interfaces activas
  };

  console.log('[WebSocket] Emitiendo subscribe-bandwidth con opciones:', subscriptionOptions);
  socketInstance.emit('subscribe-bandwidth', subscriptionOptions);

  // Manejador de datos actualizado para el nuevo formato
  socketInstance.on('bandwidth-data', (response) => {
    console.log('[WebSocket] 📊 Respuesta recibida:', response);

    // El nuevo backend envía un objeto con { data, timestamp, interval }
    const data = response.data || response;
    
    if (!Array.isArray(data)) {
      console.error('[WebSocket] ❌ Los datos no son un array:', data);
      callback([]);
      return;
    }

    // Validar y procesar datos
    const validData = data.filter(item => {
      return item && 
             typeof item.rxBits === 'number' && 
             typeof item.txBits === 'number' &&
             item.interface &&
             item.timestamp;
    });

    if (validData.length !== data.length) {
      console.warn(`[WebSocket] ⚠️ Filtrados ${data.length - validData.length} items inválidos`);
    }

    console.log(`[WebSocket] ✅ Procesando ${validData.length} items válidos`);
    
    // Agregar timestamp si no existe en items individuales
    const processedData = validData.map(item => ({
      ...item,
      timestamp: item.timestamp || response.timestamp || new Date().toISOString()
    }));

    callback(processedData);
  });

  // Agregar listeners para debugging
  socketInstance.on('error', (error) => {
    console.error('[WebSocket] Error evento:', error);
  });

  socketInstance.on('warning', (warning) => {
    console.warn('[WebSocket] Warning evento:', warning);
  });

  // Log de todos los eventos para debugging
  socketInstance.onAny((eventName, ...args) => {
    console.log(`[WebSocket] Evento recibido: ${eventName}`, args);
  });

  isSubscribed = true;
  console.log('[WebSocket] ✅ Suscripción exitosa');
};

export const unsubscribeFromBandwidth = () => {
  console.log('[WebSocket] Cancelando suscripción...');
  if (socketInstance && isSubscribed) {
    socketInstance.off('bandwidth-data');
    socketInstance.off('error');
    socketInstance.off('warning');
    // No hay un evento unsubscribe-bandwidth en el backend actual
    isSubscribed = false;
  }
  bandwidthCallback = null;
};

export const disconnectSocket = () => {
  console.log('[WebSocket] Desconectando...');
  unsubscribeFromBandwidth();
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  reconnectAttempts = 0;
};

export const getSocketStatus = () => {
  return {
    connected: socketInstance?.connected || false,
    id: socketInstance?.id || null,
    subscribed: isSubscribed,
    attempts: reconnectAttempts
  };
};