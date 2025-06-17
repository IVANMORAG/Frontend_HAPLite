// AuthContext.js - VERSIÓN CORREGIDA
import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';
import { disconnectSocket } from './socket'; // ✅ Solo necesitas disconnectSocket

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Configurar el token en axios
        api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
        console.log('Usuario cargado desde localStorage');
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password
      });

      const { token, user: userData } = response.data;
      const user = { ...userData, token };

      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      // ✅ CORRECCIÓN: El socket no necesita token según tu API
      console.log('Login exitoso, socket se conectará automáticamente cuando sea necesario');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Error en el login'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // ✅ CORRECCIÓN: Desconectar socket al hacer logout
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);