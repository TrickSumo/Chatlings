import React, { useEffect, useRef, useState } from 'react';
import { WSS_API_BASE_URL, getAccessToken } from '../utils/utils';

console.log(`WebSocket URL: ${WSS_API_BASE_URL}?Authorization=${getAccessToken()}`);


const Home = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Replace with your WebSocket endpoint
    const socket = new WebSocket(`${WSS_API_BASE_URL}?Authorization=${getAccessToken()}`);
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      console.log('📩 Message from server:', event.data);
    };

    socket.onclose = () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error('⚠️ WebSocket error:', error);
    };

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, []);

  // Example: Send a message to "message" route
  const sendMessage = () => {
    if (socketRef.current && connected) {
      socketRef.current.send(JSON.stringify({
        action: 'message',
        data: 'Hello from client'
      }));
    }
  };

  return (
    <div>
      <h1>Home</h1>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <button onClick={sendMessage} disabled={!connected}>Send Message</button>
    </div>
  );
};

export default Home;
