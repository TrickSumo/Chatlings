import useSimpleWebSocketStore, { CONNECTION_STATES } from '../stores/simpleWebSocketStore';

export const useSimpleWebSocket = () => {
  const {
    connectionState,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    isConnected,
    isConnecting,
    sendMessageWithAck
  } = useSimpleWebSocketStore();

  // Simple send function
  const send = (message) => {
    return sendMessage(message);
  };

  // Connection status
  const getStatus = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return { icon: '🟢', text: 'Connected' };
      case CONNECTION_STATES.CONNECTING:
        return { icon: '🟡', text: 'Connecting...' };
      default:
        return { icon: '🔴', text: 'Disconnected' };
    }
  };

  return {
    // State
    connectionState,
    isConnected: isConnected(),
    isConnecting: isConnecting(),
    messages,
    error,
    
    // Actions
    connect,
    disconnect,
    send,
    sendMessageWithAck,
    clearMessages,
    getStatus
  };
};

export default useSimpleWebSocket;
