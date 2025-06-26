import React, { useState } from 'react';
import useSimpleWebSocket from '../hooks/useSimpleWebSocket';

const SimpleHome = () => {
  const [messageInput, setMessageInput] = useState('');
  
  const {
    isConnected,
    isConnecting,
    messages,
    error,
    connect,
    disconnect,
    send,
    clearMessages,
    getStatus
  } = useSimpleWebSocket(); // Much simpler!

  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected) {
      // Send simple message
      const success = send({
        action: 'message',
        text: messageInput.trim(),
        timestamp: new Date().toISOString()
      });
      
      if (success) {
        setMessageInput('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const status = getStatus();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Simple WebSocket Demo</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Click "Connect" to start the WebSocket connection, then try sending messages!
      </p>
      
      {/* Connection Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        border: '2px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: isConnected ? '#e8f5e8' : '#ffeaea'
      }}>
        <h3>Status: {status.icon} {status.text}</h3>
        
        {error && (
          <p style={{ color: 'red', margin: '10px 0' }}>
            Error: {error}
          </p>
        )}
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={connect} 
            disabled={isConnected || isConnecting}
            style={{ 
              padding: '8px 16px', 
              marginRight: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected || isConnecting ? 'not-allowed' : 'pointer'
            }}
          >
            Connect
          </button>
          <button 
            onClick={disconnect} 
            disabled={!isConnected}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isConnected ? 'not-allowed' : 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Send Message */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Send Message</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={!isConnected}
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!isConnected || !messageInput.trim()}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isConnected && messageInput.trim() ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected && messageInput.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Messages */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>Messages ({messages.length})</h3>
          <button 
            onClick={clearMessages}
            style={{ 
              padding: '5px 10px', 
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
        
        <div style={{ 
          height: '300px', 
          overflowY: 'auto', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          padding: '10px',
          backgroundColor: '#f8f9fa'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: '100px' }}>
              No messages yet. Send a message to see it here!
            </p>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                style={{ 
                  marginBottom: '15px', 
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #eee',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  📅 {new Date(message.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {message.action && <strong>[{message.action}]</strong>}
                  {message.text ? (
                    <span> {message.text}</span>
                  ) : (
                    <pre style={{ margin: 0, fontSize: '12px', color: '#333' }}>
                      {JSON.stringify(message.data || message, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleHome;
