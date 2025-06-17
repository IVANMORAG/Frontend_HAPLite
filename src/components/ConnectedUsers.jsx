import { useState } from 'react';
import { setSpeedLimit, kickUser, unblockUser } from '../services/api';

export default function ConnectedUsers({ users, loading }) {
  const [actionLoading, setActionLoading] = useState({});
  const [speedLimits, setSpeedLimits] = useState({});

  const handleSetSpeedLimit = async (ip) => {
    const rxLimit = speedLimits[ip]?.rx || 1000000; // Default 1Mbps
    const txLimit = speedLimits[ip]?.tx || 1000000; // Default 1Mbps
    setActionLoading({ ...actionLoading, [ip]: 'limit' });

    try {
      const result = await setSpeedLimit(ip, rxLimit, txLimit);
      if (result.success) {
        alert(result.message);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error estableciendo límite: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleKickUser = async (ip) => {
    setActionLoading({ ...actionLoading, [ip]: 'kick' });

    try {
      const result = await kickUser(ip);
      if (result.success) {
        alert(result.message);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error eliminando usuario: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleUnblockUser = async (ip) => {
    setActionLoading({ ...actionLoading, [ip]: 'unblock' });

    try {
      const result = await unblockUser(ip);
      if (result.success) {
        alert(result.message);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error desbloqueando usuario: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [ip]: null });
    }
  };

  const handleSpeedChange = (ip, type, value) => {
    setSpeedLimits({
      ...speedLimits,
      [ip]: { ...speedLimits[ip], [type]: value },
    });
  };

  console.log('Usuarios recibidos en ConnectedUsers:', users); // Depuración

  if (loading && users.length === 0) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Cargando usuarios...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="text-center">No hay usuarios conectados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Usuarios Conectados</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">IP</th>
            <th className="py-2 px-4 border-b">MAC</th>
            <th className="py-2 px-4 border-b">Hostname</th>
            <th className="py-2 px-4 border-b">Interfaz</th>
            <th className="py-2 px-4 border-b">Estado</th>
            <th className="py-2 px-4 border-b">Última vez visto</th>
            <th className="py-2 px-4 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">{user.ip}</td>
              <td className="py-2 px-4 border-b">{user.mac}</td>
              <td className="py-2 px-4 border-b">{user.hostname}</td>
              <td className="py-2 px-4 border-b">{user.interface}</td>
              <td className="py-2 px-4 border-b">{user.status}</td>
              <td className="py-2 px-4 border-b">{user.lastSeen}</td>
              <td className="py-2 px-4 border-b">
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Rx (bps)"
                      value={speedLimits[user.ip]?.rx || ''}
                      onChange={(e) => handleSpeedChange(user.ip, 'rx', e.target.value)}
                      className="w-24 p-1 border rounded"
                    />
                    <input
                      type="number"
                      placeholder="Tx (bps)"
                      value={speedLimits[user.ip]?.tx || ''}
                      onChange={(e) => handleSpeedChange(user.ip, 'tx', e.target.value)}
                      className="w-24 p-1 border rounded"
                    />
                    <button
                      onClick={() => handleSetSpeedLimit(user.ip)}
                      disabled={actionLoading[user.ip] === 'limit'}
                      className={`px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 ${
                        actionLoading[user.ip] === 'limit' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionLoading[user.ip] === 'limit' ? 'Limitando...' : 'Limitar'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleKickUser(user.ip)}
                      disabled={actionLoading[user.ip] === 'kick'}
                      className={`px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 ${
                        actionLoading[user.ip] === 'kick' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionLoading[user.ip] === 'kick' ? 'Eliminando...' : 'Eliminar'}
                    </button>
                    <button
                      onClick={() => handleUnblockUser(user.ip)}
                      disabled={actionLoading[user.ip] === 'unblock'}
                      className={`px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                        actionLoading[user.ip] === 'unblock' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionLoading[user.ip] === 'unblock' ? 'Desbloqueando...' : 'Desbloquear'}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}