import { useState } from 'react';
import { setSpeedLimit, removeSpeedLimit, kickUser, unblockUser } from '../services/api';
import Swal from 'sweetalert2';

export default function ConnectedUsers({ users, loading, onUsersUpdate }) {
  const [actionLoading, setActionLoading] = useState({});
  const [speedLimits, setSpeedLimits] = useState({});
  const [showSpeedLimit, setShowSpeedLimit] = useState({});
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  // NUEVO: Estado local para trackear límites aplicados
  const [localSpeedLimits, setLocalSpeedLimits] = useState({});

  console.log('ConnectedUsers render - users:', users); // DEBUG

  const handleSetSpeedLimit = async (ip) => {
    // Usar valores del estado o valores por defecto si no están definidos
    const rxLimit = speedLimits[ip]?.rx !== undefined ? speedLimits[ip].rx : 1000000; // 1 Mbps por defecto
    const txLimit = speedLimits[ip]?.tx !== undefined ? speedLimits[ip].tx : 1000000; // 1 Mbps por defecto

    console.log(`Setting speed limit for ${ip}: RX=${rxLimit} (${rxLimit/1000000}Mbps), TX=${txLimit} (${txLimit/1000000}Mbps)`);

    if (rxLimit < 0 || txLimit < 0) {
      Swal.fire({
        title: '⚠️ Límites inválidos',
        text: 'Los límites no pueden ser negativos. Usa 0 para bloquear internet.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Crear mensaje más claro
    const getMessage = (limit) => {
      if (limit === 0) return 'Sin internet (bloqueado)';
      return `${(limit / 1000000).toFixed(2)} Mbps`;
    };

    const result = await Swal.fire({
      title: '🚀 Establecer límite de velocidad',
      html: `
        <div class="text-left">
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Subida:</strong> ${getMessage(txLimit)}</p>
          <p><strong>Descarga:</strong> ${getMessage(rxLimit)}</p>
          ${(rxLimit === 0 || txLimit === 0) ? '<p style="color: red;"><strong>⚠️ El usuario tendrá internet bloqueado</strong></p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Sí, establecer',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setActionLoading({ ...actionLoading, [ip]: 'limit' });

    try {
      const response = await setSpeedLimit(ip, rxLimit, txLimit);
      if (response.success) {
        // NUEVO: Actualizar estado local inmediatamente con información más detallada
        let displayText;
        if (rxLimit === 0 && txLimit === 0) {
          displayText = 'Internet Bloqueado';
        } else if (rxLimit === 0) {
          displayText = `Subida Bloqueada / ${(txLimit/1000000).toFixed(1)} Mbps`;
        } else if (txLimit === 0) {
          displayText = `${(rxLimit/1000000).toFixed(1)} Mbps / Descarga Bloqueada`;
        } else {
          displayText = `${(rxLimit/1000000).toFixed(1)} / ${(txLimit/1000000).toFixed(1)} Mbps`;
        }
        
        setLocalSpeedLimits(prev => ({
          ...prev,
          [ip]: {
            hasLimit: true,
            displayText: displayText,
            rxLimit,
            txLimit,
            isBlocked: rxLimit === 0 || txLimit === 0,
            appliedAt: Date.now()
          }
        }));

        Swal.fire({
          title: '✅ Límite establecido',
          text: 'Límite de velocidad aplicado correctamente',
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          timer: 2000
        });
        setShowSpeedLimit({ ...showSpeedLimit, [ip]: false });
        
        // Actualizar datos del servidor después de un momento
        setTimeout(() => {
          if (onUsersUpdate) {
            onUsersUpdate();
          }
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      Swal.fire({
        title: '❌ Error',
        text: error.message || 'Error estableciendo límite de velocidad',
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleRemoveSpeedLimit = async (ip) => {
    const result = await Swal.fire({
      title: '🗑️ Quitar límite de velocidad',
      html: `
        <div class="text-left">
          <p>¿Estás seguro de que quieres quitar el límite de velocidad?</p>
          <p><strong>IP:</strong> ${ip}</p>
          <p>El usuario tendrá velocidad sin restricciones.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, quitar límite',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setActionLoading({ ...actionLoading, [ip]: 'remove' });

    try {
      const response = await removeSpeedLimit(ip);
      if (response.success) {
        // NUEVO: Remover del estado local inmediatamente
        setLocalSpeedLimits(prev => {
          const updated = { ...prev };
          delete updated[ip];
          return updated;
        });

        Swal.fire({
          title: '✅ Límite removido',
          text: 'El límite de velocidad ha sido quitado',
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          timer: 2000
        });
        
        // Actualizar datos del servidor
        setTimeout(() => {
          if (onUsersUpdate) {
            onUsersUpdate();
          }
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      Swal.fire({
        title: '❌ Error',
        text: error.message || 'Error quitando límite de velocidad',
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleKickUser = async (ip, dispositivo) => {
    const result = await Swal.fire({
      title: '🚫 Bloquear usuario',
      html: `
        <div class="text-left">
          <p>¿Estás seguro de que quieres bloquear este usuario?</p>
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Dispositivo:</strong> ${dispositivo || 'Sin nombre'}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, bloquear',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setActionLoading({ ...actionLoading, [ip]: 'kick' });

    try {
      const response = await kickUser(ip);
      if (response.success) {
        setBlockedUsers(new Set([...blockedUsers, ip]));
        Swal.fire({
          title: '✅ Usuario bloqueado',
          text: 'Usuario bloqueado correctamente',
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          timer: 2000
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      Swal.fire({
        title: '❌ Error',
        text: error.message || 'Error bloqueando usuario',
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleUnblockUser = async (ip, dispositivo) => {
    const result = await Swal.fire({
      title: '🔓 Desbloquear usuario',
      html: `
        <div class="text-left">
          <p>¿Quieres desbloquear este usuario?</p>
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Dispositivo:</strong> ${dispositivo || 'Sin nombre'}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setActionLoading({ ...actionLoading, [ip]: 'unblock' });

    try {
      const response = await unblockUser(ip);
      if (response.success) {
        const newBlockedUsers = new Set(blockedUsers);
        newBlockedUsers.delete(ip);
        setBlockedUsers(newBlockedUsers);
        
        Swal.fire({
          title: '✅ Usuario desbloqueado',
          text: 'Usuario desbloqueado correctamente',
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          timer: 2000
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      Swal.fire({
        title: '❌ Error',
        text: error.message || 'Error desbloqueando usuario',
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleSpeedChange = (ip, type, value) => {
    // Convertir valor y manejar casos especiales
    let numericValue;
    
    if (value === '' || value === null || value === undefined) {
      numericValue = 1000000; // 1 Mbps por defecto si está vacío
    } else {
      numericValue = parseFloat(value);
      // Permitir 0 explícitamente para bloquear
      if (isNaN(numericValue) || numericValue < 0) {
        numericValue = 0;
      }
    }
    
    setSpeedLimits({
      ...speedLimits,
      [ip]: { 
        ...speedLimits[ip], 
        [type]: numericValue 
      },
    });
    
    console.log(`Speed change for ${ip}: ${type} = ${numericValue} (${numericValue/1000000} Mbps)`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // FUNCIÓN MEJORADA para detectar límites
  const hasSpeedLimit = (user) => {
    const ip = user.ip;
    
    // 1. Verificar estado local primero (más reciente)
    if (localSpeedLimits[ip] && localSpeedLimits[ip].hasLimit) {
      return true;
    }
    
    // 2. Verificar datos del backend
    return (
      user.hasSpeedLimit ||
      (user.velocidadConexion && user.velocidadConexion !== 'Sin límite') ||
      (user.speedLimit && user.speedLimit !== 'Sin límite' && user.speedLimit !== null && user.speedLimit !== '')
    );
  };

  // FUNCIÓN MEJORADA para mostrar velocidad
  const getSpeedDisplay = (user) => {
    const ip = user.ip;
    
    // 1. Verificar estado local primero
    if (localSpeedLimits[ip] && localSpeedLimits[ip].hasLimit) {
      return localSpeedLimits[ip].displayText;
    }
    
    // 2. Usar datos del backend
    if (hasSpeedLimit(user)) {
      return user.velocidadConexion || user.speedLimit || 'Limitado';
    }
    
    return 'Sin límite';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando usuarios conectados...</p>
        </div>
      </div>
    );
  }

  console.log('About to render users, count:', users?.length); // DEBUG

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center py-8">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay usuarios conectados</h3>
          <p className="mt-2 text-gray-500">Los usuarios conectados aparecerán aquí</p>
        </div>
      </div>
    );
  }

  // Separar usuarios
  const activeUsers = users.filter(user => !blockedUsers.has(user.ip));
  const blockedUsersList = users.filter(user => blockedUsers.has(user.ip));
  const usersWithLimits = activeUsers.filter(user => hasSpeedLimit(user));
  const usersWithoutLimits = activeUsers.filter(user => !hasSpeedLimit(user));

  return (
    <div className="space-y-6">
      {/* DEBUG INFO - Más detallado */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
        <strong>Debug:</strong> Total users: {users.length}, 
        Sin límites: {usersWithoutLimits.length}, 
        Con límites: {usersWithLimits.length}, 
        Bloqueados: {blockedUsersList.length}
        <br />
        <strong>Estado local:</strong> {JSON.stringify(localSpeedLimits)}
      </div>

      {/* Usuarios sin límites */}
      {usersWithoutLimits.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364l9-9 4 4-9 9H5.636v-4z" />
                </svg>
                Usuarios Sin Límites
              </h2>
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <span className="text-white font-semibold">{usersWithoutLimits.length}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersWithoutLimits.map((user, index) => (
                <div key={`no-limit-${user.ip || index}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-bold text-lg text-blue-600">{user.ip}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>

                  {/* Info principal */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">📱 Dispositivo:</span>
                      <span className="text-gray-800 font-semibold truncate ml-2">
                        {user.dispositivo || user.hostname || 'Desconocido'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">⚡ Velocidad:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${
                          localSpeedLimits[user.ip]?.isBlocked || getSpeedDisplay(user).includes('BLOQUEADO') || getSpeedDisplay(user).includes('Bloqueado')
                            ? 'text-red-600' 
                            : hasSpeedLimit(user) 
                              ? 'text-orange-600' 
                              : 'text-green-600'
                        }`}>
                          {getSpeedDisplay(user)}
                        </span>
                        {hasSpeedLimit(user) && (
                          <button
                            onClick={() => handleRemoveSpeedLimit(user.ip)}
                            disabled={actionLoading[user.ip] === 'remove'}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Quitar límite"
                          >
                            {actionLoading[user.ip] === 'remove' ? '⏳' : '🗑️'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info adicional */}
                    <details className="text-sm text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">Ver más info</summary>
                      <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
                        <div>MAC: <span className="font-mono">{user.mac?.toUpperCase() || 'N/A'}</span></div>
                        <div>Interfaz: <span>{user.interface}</span></div>
                        <div>Último visto: <span>{user.lastSeen}</span></div>
                        <div className="text-xs text-yellow-600">
                          Backend hasLimit: {user.hasSpeedLimit ? 'true' : 'false'}, 
                          Local hasLimit: {localSpeedLimits[user.ip]?.hasLimit ? 'true' : 'false'}
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* Panel de límites */}
                  {showSpeedLimit[user.ip] && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Subida (Mbps)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={speedLimits[user.ip]?.tx !== undefined ? speedLimits[user.ip].tx / 1000000 : ''}
                            onChange={(e) => handleSpeedChange(user.ip, 'tx', parseFloat(e.target.value || 0) * 1000000)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="1.0 (o 0 para bloquear)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descarga (Mbps)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={speedLimits[user.ip]?.rx !== undefined ? speedLimits[user.ip].rx / 1000000 : ''}
                            onChange={(e) => handleSpeedChange(user.ip, 'rx', parseFloat(e.target.value || 0) * 1000000)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="2.0 (o 0 para bloquear)"
                          />
                        </div>
                      </div>
                      
                      {/* Botones rápidos para límites comunes */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">⚡ Límites rápidos:</div>
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => {
                              setSpeedLimits({
                                ...speedLimits,
                                [user.ip]: { rx: 500000, tx: 500000 } // 0.5/0.5
                              });
                            }}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                          >
                            0.5 Mbps
                          </button>
                          <button
                            onClick={() => {
                              setSpeedLimits({
                                ...speedLimits,
                                [user.ip]: { rx: 1000000, tx: 1000000 } // 1/1
                              });
                            }}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            1 Mbps
                          </button>
                          <button
                            onClick={() => {
                              setSpeedLimits({
                                ...speedLimits,
                                [user.ip]: { rx: 2000000, tx: 1000000 } // 2/1
                              });
                            }}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            2/1 Mbps
                          </button>
                          <button
                            onClick={() => {
                              setSpeedLimits({
                                ...speedLimits,
                                [user.ip]: { rx: 0, tx: 0 } // Bloquear
                              });
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            🚫 Bloquear
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-2">
                        💡 Tip: 0 = bloquear internet, vacío = usar límite por defecto
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSetSpeedLimit(user.ip)}
                          disabled={actionLoading[user.ip] === 'limit'}
                          className="flex-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {actionLoading[user.ip] === 'limit' ? '⏳' : '✓'} Aplicar
                        </button>
                        <button
                          onClick={() => setShowSpeedLimit({ ...showSpeedLimit, [user.ip]: false })}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowSpeedLimit({ ...showSpeedLimit, [user.ip]: !showSpeedLimit[user.ip] })}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Limitar
                    </button>
                    <button
                      onClick={() => handleKickUser(user.ip, user.dispositivo || user.hostname)}
                      disabled={actionLoading[user.ip] === 'kick'}
                      className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
                    >
                      {actionLoading[user.ip] === 'kick' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                          Bloquear
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Usuarios con límites */}
      {usersWithLimits.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Usuarios Limitados
              </h2>
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <span className="text-white font-semibold">{usersWithLimits.length}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersWithLimits.map((user, index) => (
                <div key={`limited-${user.ip || index}`} className="border border-orange-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-orange-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="font-bold text-lg text-blue-600">{user.ip}</span>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Limitado
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">📱 Dispositivo:</span>
                      <span className="text-gray-800 font-semibold truncate ml-2">
                        {user.dispositivo || user.hostname || 'Desconocido'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">⚡ Velocidad:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-orange-600">
                          {getSpeedDisplay(user)}
                        </span>
                        <button
                          onClick={() => handleRemoveSpeedLimit(user.ip)}
                          disabled={actionLoading[user.ip] === 'remove'}
                          className="text-red-500 hover:text-red-700 text-sm"
                          title="Quitar límite"
                        >
                          {actionLoading[user.ip] === 'remove' ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>

                    {/* Info adicional para usuarios limitados */}
                    <details className="text-sm text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">Ver más info</summary>
                      <div className="mt-2 space-y-1 pl-4 border-l-2 border-orange-200">
                        <div>MAC: <span className="font-mono">{user.mac?.toUpperCase() || 'N/A'}</span></div>
                        <div>Interfaz: <span>{user.interface}</span></div>
                        <div>Último visto: <span>{user.lastSeen}</span></div>
                        {user.queueInfo && (
                          <div className="text-xs text-orange-600">
                            Queue: {user.queueInfo.queueName}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>

                  {/* Panel de modificación de límites */}
                  {showSpeedLimit[user.ip] && (
                    <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Subida (Mbps)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={speedLimits[user.ip]?.tx !== undefined ? speedLimits[user.ip].tx / 1000000 : ''}
                            onChange={(e) => handleSpeedChange(user.ip, 'tx', parseFloat(e.target.value || 0) * 1000000)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            placeholder="Nuevo límite subida"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descarga (Mbps)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={speedLimits[user.ip]?.rx !== undefined ? speedLimits[user.ip].rx / 1000000 : ''}
                            onChange={(e) => handleSpeedChange(user.ip, 'rx', parseFloat(e.target.value || 0) * 1000000)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            placeholder="Nuevo límite descarga"
                          />
                        </div>
                      </div>

                      {/* Botones rápidos para usuarios limitados */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">⚡ Acciones rápidas:</div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => {
                              setSpeedLimits({
                                ...speedLimits,
                                [user.ip]: { rx: 1000000, tx: 1000000 } // 1/1
                              });
                            }}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            1 Mbps
                          </button>
                          <button
                            onClick={() => {
                              setSpeedLimits({
                                ...speedLimits,
                                [user.ip]: { rx: 0, tx: 0 } // Bloquear
                              });
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            🚫 Bloquear
                          </button>
                          <button
                            onClick={() => handleRemoveSpeedLimit(user.ip)}
                            disabled={actionLoading[user.ip] === 'remove'}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            {actionLoading[user.ip] === 'remove' ? '⏳' : '🔄 Sin límite'}
                          </button>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSetSpeedLimit(user.ip)}
                          disabled={actionLoading[user.ip] === 'limit'}
                          className="flex-1 px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
                        >
                          {actionLoading[user.ip] === 'limit' ? '⏳' : '✓'} Actualizar
                        </button>
                        <button
                          onClick={() => setShowSpeedLimit({ ...showSpeedLimit, [user.ip]: false })}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowSpeedLimit({ ...showSpeedLimit, [user.ip]: !showSpeedLimit[user.ip] })}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center justify-center"
                    >
                      Modificar
                    </button>
                    <button
                      onClick={() => handleKickUser(user.ip, user.dispositivo || user.hostname)}
                      disabled={actionLoading[user.ip] === 'kick'}
                      className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
                    >
                      {actionLoading[user.ip] === 'kick' ? '⏳' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Usuarios bloqueados */}
      {blockedUsersList.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                Usuarios Bloqueados
              </h2>
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <span className="text-white font-semibold">{blockedUsersList.length}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockedUsersList.map((user, index) => (
                <div key={`blocked-${user.ip || index}`} className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-bold text-lg text-blue-600">{user.ip}</span>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Bloqueado
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Dispositivo:</span>
                      <span className="text-gray-700 truncate ml-2">{user.dispositivo || user.hostname || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">MAC:</span>
                      <span className="text-gray-700 font-mono text-xs">{user.mac?.toUpperCase() || 'N/A'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblockUser(user.ip, user.dispositivo || user.hostname)}
                    disabled={actionLoading[user.ip] === 'unblock'}
                    className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading[user.ip] === 'unblock' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        🔓 Desbloquear
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">💡 Consejos de uso:</p>
            <ul className="space-y-1 text-xs">
              <li>• Los cambios se aplican inmediatamente y se reflejan en la interfaz</li>
              <li>• Los límites se muestran como: Subida / Descarga (en Mbps)</li>
              <li>• Un valor de 0 bloquea completamente el acceso a internet</li>
              <li>• Los usuarios bloqueados se desbloquean automáticamente después de 5 minutos</li>
              <li>• La información de debug ayuda a identificar problemas de sincronización</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}