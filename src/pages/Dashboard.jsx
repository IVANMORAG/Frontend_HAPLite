import { useState, useEffect, useCallback } from 'react';
import { getConnectedUsers, getBandwidthHistory } from '../services/api';
import { subscribeToBandwidth, unsubscribeFromBandwidth, getSocketStatus } from '../services/socket';
import ConnectedUsers from '../components/ConnectedUsers';
import BandwidthChart from '../components/BandwidthChart';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [bandwidthData, setBandwidthData] = useState([]);
  const [loading, setLoading] = useState({
    users: true,
    bandwidth: true
  });
  const [error, setError] = useState({
    users: null,
    bandwidth: null
  });
  const [socketConnected, setSocketConnected] = useState(false);

  // Cargar usuarios conectados
  const loadUsers = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      setError(prev => ({ ...prev, users: null }));
      
      const response = await getConnectedUsers();
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(prev => ({ ...prev, users: response.error }));
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError(prev => ({ ...prev, users: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  // Cargar historial de ancho de banda
  const loadBandwidthHistory = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, bandwidth: true }));
      setError(prev => ({ ...prev, bandwidth: null }));
      
      const response = await getBandwidthHistory();
      
      if (response.success && response.data) {
        console.log('Historial cargado:', response.data.length, 'puntos');
        setBandwidthData(response.data);
      } else {
        setError(prev => ({ ...prev, bandwidth: response.error || 'Sin datos' }));
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError(prev => ({ ...prev, bandwidth: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, bandwidth: false }));
    }
  }, []);

  // Manejador de datos del WebSocket
  const handleBandwidthData = useCallback((newData) => {
    console.log('[Dashboard] Nuevos datos recibidos:', newData.length);
    
    if (!Array.isArray(newData) || newData.length === 0) {
      console.warn('[Dashboard] Datos inválidos o vacíos');
      return;
    }
    
    setBandwidthData(prev => {
      // Agregar interfaces a los datos existentes si no están
      const existingInterfaces = {};
      prev.forEach(item => {
        if (item.interface) {
          existingInterfaces[item.interface] = true;
        }
      });

      // Combinar datos por interfaz
      const combinedData = [...prev];
      
      newData.forEach(newItem => {
        // Si es la misma interfaz, agregar al final
        combinedData.push(newItem);
      });

      // Mantener solo los últimos 100 puntos totales
      const limited = combinedData.slice(-100);
      
      console.log('[Dashboard] Datos actualizados:', limited.length, 'puntos totales');
      return limited;
    });
    
    // Quitar estado de carga
    setLoading(prev => ({ ...prev, bandwidth: false }));
    setError(prev => ({ ...prev, bandwidth: null }));
  }, []);

  // Verificar estado del socket periódicamente
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const status = getSocketStatus();
      setSocketConnected(status.connected);
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    console.log('[Dashboard] Cargando datos iniciales...');
    loadUsers();
    loadBandwidthHistory();

    // Actualizar usuarios cada 30 segundos
    const usersInterval = setInterval(loadUsers, 30000);
    
    return () => {
      clearInterval(usersInterval);
    };
  }, [loadUsers, loadBandwidthHistory]);

  // Configurar WebSocket
  useEffect(() => {
    console.log('[Dashboard] Configurando WebSocket...');
    
    // Pequeño delay para asegurar que el socket esté listo
    const timeout = setTimeout(() => {
      subscribeToBandwidth(handleBandwidthData);
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      console.log('[Dashboard] Limpiando WebSocket...');
      unsubscribeFromBandwidth();
    };
  }, [handleBandwidthData]);

  // Calcular estadísticas
  const stats = {
    totalRx: bandwidthData.reduce((sum, item) => sum + (item.rxBits || 0), 0),
    totalTx: bandwidthData.reduce((sum, item) => sum + (item.txBits || 0), 0),
    avgRx: bandwidthData.length > 0 
      ? bandwidthData.reduce((sum, item) => sum + (item.rxBits || 0), 0) / bandwidthData.length 
      : 0,
    avgTx: bandwidthData.length > 0
      ? bandwidthData.reduce((sum, item) => sum + (item.txBits || 0), 0) / bandwidthData.length
      : 0
  };

  const formatBits = (bits) => {
    if (bits >= 1e9) return `${(bits / 1e9).toFixed(2)} Gbps`;
    if (bits >= 1e6) return `${(bits / 1e6).toFixed(2)} Mbps`;
    if (bits >= 1e3) return `${(bits / 1e3).toFixed(2)} Kbps`;
    return `${bits.toFixed(0)} bps`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Monitoreo</h1>
        <p className="text-gray-600 mt-1">Visualización en tiempo real del tráfico de red</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700">Usuarios Conectados</h3>
          <p className="text-2xl font-bold text-blue-600">
            {loading.users ? '...' : users.length}
          </p>
          {error.users && (
            <p className="text-sm text-red-500 mt-1">{error.users}</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700">Promedio Descarga</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatBits(stats.avgRx)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700">Promedio Subida</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatBits(stats.avgTx)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700">Estado WebSocket</h3>
          <p className={`text-2xl font-bold ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
            {socketConnected ? 'Conectado' : 'Desconectado'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {bandwidthData.length} puntos
          </p>
        </div>
      </div>

      {/* Gráfica de Ancho de Banda */}
      <BandwidthChart 
        data={bandwidthData} 
        loading={loading.bandwidth && bandwidthData.length === 0}
        error={error.bandwidth}
      />

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg shadow p-6">
        <ConnectedUsers 
          users={users} 
          loading={loading.users} 
        />
      </div>

      {/* Botón de Actualización */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            loadUsers();
            loadBandwidthHistory();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          disabled={loading.users || loading.bandwidth}
        >
          {loading.users || loading.bandwidth ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Actualizando...
            </span>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar Datos
            </>
          )}
        </button>
      </div>
    </div>
  );
}