// src/components/Layout.jsx
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../services/auth';
import { connectSocket, disconnectSocket } from '../services/socket';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Conectar socket solo si no está conectado
      const socket = connectSocket(user.token);
      
      return () => {
        // No desconectamos aquí para mantener la conexión
        // Solo manejamos la desconexión en el logout
      };
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}