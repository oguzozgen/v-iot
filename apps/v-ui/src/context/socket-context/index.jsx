import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import configApp from '../../config/config.app.jsx';

// Message buffer for handling high-frequency messages
const messageBuffer = [];
const BUFFER_FLUSH_INTERVAL = 100; // Process every 100ms
let bufferInterval = null;

// Get persistent client ID from localStorage or create a new one
const getOrCreateClientId = () => {
  const storedClientId = localStorage.getItem('socket_client_id');

  if (storedClientId) {
    console.log(`Using existing client ID: ${storedClientId}`);
    return storedClientId;
  }

  // Create new client ID if none exists
  const newClientId = `client_ui_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  localStorage.setItem('socket_client_id', newClientId);
  console.log(`Created new client ID: ${newClientId}`);
  return newClientId;
};

// Create socket connection
const createSocketConnection = (clientId) => {
  return io(configApp.serverAddress, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: false,
    query: {
      clientId,
      clientTimestamp: Date.now(),
    }
  });
};

// Create context
const SocketContext = createContext({
  socket: null,
  connected: false,
  subscribedVin: null,
  joinVehicleRoom: () => { },
  leaveVehicleRoom: () => { },
  reconnect: () => { },
  disconnect: () => { },
  sendTestMessage: () => { },
  getServerStats: () => { },
  sendPing: () => { },
  getSubscribedVin: () => null,
  isSubscribedToVehicle: () => false,
});

export const SocketContextProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [subscribedVin, setSubscribedVin] = useState(null);
  const socketRef = useRef(null);
  const clientIdRef = useRef(null);
  const subscribedVinRef = useRef(null);
  const emptyRoomPingIntervalRef = useRef(null);

  // Keep subscribedVinRef in sync with subscribedVin state
  useEffect(() => {
    subscribedVinRef.current = subscribedVin;
  }, [subscribedVin]);

  // Initialize socket connection
  useEffect(() => {
    // Message buffer functions
    const startBufferProcessing = () => {
      if (bufferInterval) return;

      bufferInterval = setInterval(() => {
        if (messageBuffer.length > 0) {
          const messages = messageBuffer.splice(0, messageBuffer.length);
          processBufferedMessages(messages);
        }
      }, BUFFER_FLUSH_INTERVAL);
    };

    const stopBufferProcessing = () => {
      if (bufferInterval) {
        clearInterval(bufferInterval);
        bufferInterval = null;
      }
    };

    const processBufferedMessages = (messages) => {
      messages.forEach(({ type, data }) => {
        // Console log for now - later can be expanded for actual processing
        console.log(`📨 [${type}]:`, data);

      });
    };

    const setupSocketListeners = () => {
      if (!socketRef.current) return;

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
        console.log('Socket ID:', socket.id);
        setConnected(true);
        setConnectionAttempts(0);

        // Join a default empty room to keep connection alive
        socket.emit('join_empty_room');

        // Start message buffer processing
        startBufferProcessing();

        // Start empty room ping
        startEmptyRoomPing();
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from socket:', reason);
        setConnected(false);
        setSubscribedVin(null);
        stopBufferProcessing();
      });

      socket.on('connect_error', (error) => {
        console.error('🔴 Connection error:', error);
        setConnectionAttempts(prev => prev + 1);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        setConnected(true);
        setConnectionAttempts(0);

        // Rejoin empty room after reconnection
        socket.emit('join_empty_room');
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}`);
        setConnectionAttempts(attemptNumber);
      });

      // Server events
      socket.on('connection_established', (data) => {
        console.log('📡 Connection established:', data);
      });

      socket.on('server_stats', (data) => {
        console.log('📊 Server stats:', data);
      });

      // Vehicle room events
      socket.on('joined_vehicle_room', (data) => {
        console.log('🚗 Joined vehicle room:', data);
        console.log(`🔄 Setting subscribedVin to: ${data.vin}`);
        setSubscribedVin(data.vin);
      });

      socket.on('left_vehicle_room', (data) => {
        console.log('🚗 Left vehicle room:', data);
        console.log(`🔄 Clearing subscribedVin (was: ${subscribedVinRef.current})`);
        setSubscribedVin(null);
      });

      // Vehicle events - these will only be received when subscribed to a vehicle room
      socket.on('vehicle_message', (data) => {
        console.log(`� Received vehicle_message:`, data);
        addToMessageBuffer('vehicle_message', data);
      });

      socket.on('telemetry', (data) => {
        console.log(`� Received telemetry:`, data);
        addToMessageBuffer('telemetry', data);
      });

      socket.on('location', (data) => {
        console.log(`� Received location:`, data);
        addToMessageBuffer('location', data);
      });

      socket.on('heartbeat-status', (data) => {
        console.log(`� Received heartbeat-status:`, data);
        addToMessageBuffer('heartbeat-status', data);
      });

      socket.on('mission-events', (data) => {
        console.log(`🎯 Received mission-events:`, data);
        addToMessageBuffer('mission-events', data);
      });

      socket.on('device-demands', (data) => {
        console.log(`🎯 Received device-demands:`, data);
        addToMessageBuffer('device-demands', data);
      });

      // Test events
      socket.on('test_response', (data) => {
        console.log('🧪 Test response:', data);
      });

      socket.on('pong', (data) => {
        console.log('🏓 Pong received:', data);
      });

      // Empty room events for keeping connection alive
      socket.on('joined_empty_room', () => {
        console.log('🏠 Joined empty room - connection kept alive');
      });

      socket.on('ping_response', (data) => {
        console.log('🏓 Ping response from server:', data);
      });
    };

    const initializeSocket = () => {
      try {
        // Get or create client ID
        clientIdRef.current = getOrCreateClientId();

        // Create socket connection
        socketRef.current = createSocketConnection(clientIdRef.current);

        // Setup event listeners
        setupSocketListeners();

        console.log('🔗 Socket initialized');
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
      }
    };

    const cleanup = () => {
      stopBufferProcessing();
      clearEmptyRoomPing();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    const startEmptyRoomPing = () => {
      if (emptyRoomPingIntervalRef.current) return;

      emptyRoomPingIntervalRef.current = setInterval(() => {
        if (socketRef.current && socketRef.current.connected && !subscribedVinRef.current) {
          socketRef.current.emit('empty_room_ping');
        }
      }, 30000); // Ping every 30 seconds when not subscribed to any vehicle
    };

    const clearEmptyRoomPing = () => {
      if (emptyRoomPingIntervalRef.current) {
        clearInterval(emptyRoomPingIntervalRef.current);
        emptyRoomPingIntervalRef.current = null;
      }
    };

    if (!socketRef.current) {
      initializeSocket();
    }

    return cleanup;
  }, []);

  // Message buffer functions
  const addToMessageBuffer = (type, data) => {
    messageBuffer.push({ type, data, timestamp: Date.now() });
  };

  // Public methods
  const joinVehicleRoom = (vehicleId) => {
    if (socketRef.current && connected) {
      console.log(`🚗 Joining vehicle room: ${vehicleId}`);
      console.log(`🔄 Current subscribedVin: ${subscribedVinRef.current}`);
      socketRef.current.emit('join_vehicle_room', { vin: vehicleId });
    } else {
      console.warn('⚠️ Cannot join vehicle room - socket not connected');
    }
  };

  const leaveVehicleRoom = (vehicleId) => {
    if (socketRef.current && connected) {
      console.log(`🚗 Leaving vehicle room: ${vehicleId}`);
      console.log(`🔄 Current subscribedVin: ${subscribedVinRef.current}`);
      socketRef.current.emit('leave_vehicle_room', { vin: vehicleId });

      // Join empty room after leaving vehicle room to keep connection alive
      socketRef.current.emit('join_empty_room');
    } else {
      console.warn('⚠️ Cannot leave vehicle room - socket not connected');
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      console.log('🔄 Manual reconnection requested');
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('👋 Manual disconnect requested');
      socketRef.current.disconnect();
    }
  };

  // Test functions for development
  const sendTestMessage = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('test_message', {
        message: 'Hello from UI client!',
        timestamp: Date.now()
      });
    }
  };

  const getServerStats = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('get_server_stats');
    }
  };

  const sendPing = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('ping');
    }
  };

  const getSubscribedVin = () => {
    return subscribedVin;
  };

  const isSubscribedToVehicle = () => {
    return subscribedVin !== null;
  };

  const contextValue = {
    socket: socketRef.current,
    connected,
    connectionAttempts,
    subscribedVin,
    joinVehicleRoom,
    leaveVehicleRoom,
    reconnect,
    disconnect,
    // Test methods
    sendTestMessage,
    getServerStats,
    sendPing,
    // Subscription methods
    getSubscribedVin,
    isSubscribedToVehicle,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;