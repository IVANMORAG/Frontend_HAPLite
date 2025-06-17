import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// FUNCIONES PARA GRAFICAS (NUEVAS/MODIFICADAS) ======================

/**
 * Obtiene datos de ancho de banda en formato optimizado para gráficas
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBandwidthForCharts = async () => {
  try {
    const response = await api.get('/api/mikrotik/bandwidth');
    
    // Procesamiento adicional para gráficas
    const processedData = (response.data.data || []).map(item => ({
      ...item,
      // Convertir a Mbps para mejor visualización
      rxMbps: item.rxBits ? (item.rxBits / 1000000).toFixed(2) : 0,
      txMbps: item.txBits ? (item.txBits / 1000000).toFixed(2) : 0,
      // Formatear timestamp
      time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'
    }));

    return {
      data: processedData,
      success: true,
      originalData: response.data.data // Por si acaso
    };
  } catch (error) {
    console.error('Error getting bandwidth for charts:', error);
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Obtiene historial de ancho de banda procesado para gráficas
 * @param {number} limit - Límite de puntos a devolver
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBandwidthHistoryForCharts = async (limit = 60) => {
  try {
    const response = await api.get('/api/mikrotik/bandwidth-history');
    
    // Procesamiento para gráficas
    let historyData = response.data.data || [];
    
    // Limitar puntos y formatear
    const limitedData = historyData
      .slice(-limit) // Tomar los últimos N puntos
      .map(item => ({
        ...item,
        rxMbps: item.rxBits ? (item.rxBits / 1000000).toFixed(2) : 0,
        txMbps: item.txBits ? (item.txBits / 1000000).toFixed(2) : 0,
        time: item.timestamp 
          ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'N/A'
      }));

    return {
      data: limitedData,
      success: true,
      count: limitedData.length
    };
  } catch (error) {
    console.error('Error getting bandwidth history:', error);
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Obtiene estadísticas resumidas para mostrar en tarjetas
 * @returns {Promise<{success: boolean, stats: Object, error?: string}>}
 */
export const getBandwidthStats = async () => {
  try {
    const [current, history] = await Promise.all([
      api.get('/api/mikrotik/bandwidth'),
      api.get('/api/mikrotik/bandwidth-history')
    ]);

    const currentData = current.data.data?.[0] || {};
    const historyData = history.data.data || [];

    // Calcular promedios
    const avgRx = historyData.reduce((sum, item) => sum + (item.rxBits || 0), 0) / Math.max(1, historyData.length);
    const avgTx = historyData.reduce((sum, item) => sum + (item.txBits || 0), 0) / Math.max(1, historyData.length);

    return {
      success: true,
      stats: {
        currentRx: currentData.rxBits || 0,
        currentTx: currentData.txBits || 0,
        avgRx,
        avgTx,
        maxRx: Math.max(...historyData.map(item => item.rxBits || 0)),
        maxTx: Math.max(...historyData.map(item => item.txBits || 0)),
        totalPoints: historyData.length
      }
    };
  } catch (error) {
    console.error('Error getting bandwidth stats:', error);
    return {
      success: false,
      stats: null,
      error: error.response?.data?.message || error.message
    };
  }
};

// MANTENIENDO TODAS TUS FUNCIONES EXISTENTES ========================

export const getConnectedUsers = async () => {
  try {
    const response = await api.get('/api/mikrotik/users');
    return {
      data: response.data.data || [],
      success: response.data.success,
      count: response.data.count
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const getBandwidthUsage = async () => {
  try {
    const response = await api.get('/api/mikrotik/bandwidth');
    return {
      data: response.data.data || [],
      success: response.data.success
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const getBandwidthHistory = async () => {
  try {
    const response = await api.get('/api/mikrotik/bandwidth-history');
    return {
      data: response.data.data || [],
      success: response.data.success
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const setSpeedLimit = async (ip, rxLimit, txLimit) => {
  try {
    const response = await api.post('/api/mikrotik/speed-limit', { 
      ip, 
      rxLimit: parseInt(rxLimit), 
      txLimit: parseInt(txLimit) 
    });
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const removeSpeedLimit = async (ip) => {
  try {
    const response = await api.delete(`/api/mikrotik/speed-limit/${ip}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const kickUser = async (ip) => {
  try {
    const response = await api.post('/api/mikrotik/kick-user', { ip });
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const unblockUser = async (ip) => {
  try {
    const response = await api.post('/api/mikrotik/unblock-user', { ip });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const getActiveQueues = async () => {
  try {
    const response = await api.get('/api/mikrotik/queues');
    return {
      data: response.data.data || [],
      success: response.data.success,
      count: response.data.count
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const checkConnection = async () => {
  try {
    const response = await api.get('/api/mikrotik/status');
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export default api;