// context/SocketContext.jsx
// Contexto global para la conexión Socket.io
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      // Desconectar si no hay usuario
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('pf_token');

    // Conectar al servidor Socket.io
    socketRef.current = io('http://localhost:3001', {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket conectado');
      // Unirse a sala personal para notificaciones
      socketRef.current.emit('join_user_room');
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Socket desconectado');
    });

    // Recibir notificaciones globales
    socketRef.current.on('notification', (notification) => {
      setNotifications(prev => [
        { ...notification, id: Date.now(), read: false },
        ...prev.slice(0, 19) // Máximo 20 notificaciones
      ]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      notifications,
      unreadCount,
      markAllRead,
      clearNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket debe usarse dentro de SocketProvider');
  return ctx;
};
