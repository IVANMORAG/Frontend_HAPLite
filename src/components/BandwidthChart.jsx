import { useEffect, useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function BandwidthChart({ data, loading, error }) {
  const chartRef = useRef(null);

  // Función para formatear bits a unidades legibles
  const formatBits = (bits) => {
    if (!bits || bits === 0) return '0 bps';
    const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const k = 1000;
    const i = Math.floor(Math.log(bits) / Math.log(k));
    return parseFloat((bits / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  };

  // Procesar datos para múltiples interfaces
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Agrupar datos por interfaz
    const interfaceData = {};
    data.forEach(item => {
      if (!item.interface) return;
      
      if (!interfaceData[item.interface]) {
        interfaceData[item.interface] = [];
      }
      interfaceData[item.interface].push(item);
    });

    // Tomar solo los últimos 30 puntos de cada interfaz
    Object.keys(interfaceData).forEach(iface => {
      interfaceData[iface] = interfaceData[iface].slice(-30);
    });

    return interfaceData;
  }, [data]);

  // Crear datasets para Chart.js
  const chartData = useMemo(() => {
    if (!processedData) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Obtener todas las timestamps únicas
    const allTimestamps = new Set();
    Object.values(processedData).forEach(ifaceData => {
      ifaceData.forEach(item => {
        if (item.timestamp) {
          allTimestamps.add(item.timestamp);
        }
      });
    });

    // Ordenar timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    // Crear labels (mostrar solo minutos:segundos)
    const labels = sortedTimestamps.map(ts => {
      try {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      } catch {
        return '';
      }
    });

    // Colores para diferentes interfaces
    const colors = {
      ether1: { rx: '#3B82F6', tx: '#93C5FD' }, // Azul
      wlan1: { rx: '#10B981', tx: '#86EFAC' },  // Verde
      bridge: { rx: '#F59E0B', tx: '#FCD34D' }  // Amarillo
    };

    // Crear datasets
    const datasets = [];
    Object.entries(processedData).forEach(([iface, ifaceData]) => {
      // Crear mapa de datos por timestamp
      const dataMap = {};
      ifaceData.forEach(item => {
        dataMap[item.timestamp] = item;
      });

      // Dataset para RX
      datasets.push({
        label: `${iface} RX (Download)`,
        data: sortedTimestamps.map(ts => {
          const item = dataMap[ts];
          return item ? item.rxBits : null;
        }),
        borderColor: colors[iface]?.rx || '#6B7280',
        backgroundColor: colors[iface]?.rx ? `${colors[iface].rx}20` : '#6B728020',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
        spanGaps: true
      });

      // Dataset para TX
      datasets.push({
        label: `${iface} TX (Upload)`,
        data: sortedTimestamps.map(ts => {
          const item = dataMap[ts];
          return item ? item.txBits : null;
        }),
        borderColor: colors[iface]?.tx || '#9CA3AF',
        backgroundColor: colors[iface]?.tx ? `${colors[iface].tx}20` : '#9CA3AF20',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
        spanGaps: true,
        borderDash: [5, 5] // Línea punteada para TX
      });
    });

    return {
      labels,
      datasets
    };
  }, [processedData]);

  // Opciones de la gráfica
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${formatBits(value)}`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tiempo'
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        title: {
          display: true,
          text: 'Velocidad'
        },
        ticks: {
          callback: (value) => formatBits(value)
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Limpiar gráfica al desmontar
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Estado de carga
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Cargando datos de ancho de banda...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Sin datos
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Sin datos</h3>
          <p className="mt-1 text-gray-500">Esperando datos del servidor...</p>
          <div className="mt-4">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Tráfico de Red en Tiempo Real
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Interfaces activas: {Object.keys(processedData || {}).length}</span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
            En vivo
          </span>
        </div>
      </div>
      
      <div className="h-80">
        <Line 
          ref={chartRef} 
          data={chartData} 
          options={options}
        />
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Total de puntos</p>
          <p className="font-semibold">{data.length}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Última actualización</p>
          <p className="font-semibold">{new Date().toLocaleTimeString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Intervalo</p>
          <p className="font-semibold">2s</p>
        </div>
      </div>
    </div>
  );
}