import { create } from 'zustand';
import { WSS_API_BASE_URL, getAccessToken } from '../utils/utils';
import { subscribeWithSelector } from 'zustand/middleware';

// Simple connection states
export const CONNECTION_STATES = {
    DISCONNECTED: 'DISCONNECTED',
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED'
};

const useSimpleWebSocketStore = create(subscribeWithSelector((set, get) => ({
    // State
    connectionState: CONNECTION_STATES.DISCONNECTED,
    socket: null,
    messages: [],
    error: null,

    // Connect to WebSocket
    connect: () => {
        const state = get();

        // Don't connect if already connecting or connected
        if (state.connectionState !== CONNECTION_STATES.DISCONNECTED) {
            console.log('Already connecting or connected, skipping...');
            return;
        }

        const accessToken = getAccessToken();
        if (!accessToken) {
            set({ error: 'No access token' });
            return;
        }

        set({ connectionState: CONNECTION_STATES.CONNECTING, error: null });

        const socket = new WebSocket(`${WSS_API_BASE_URL}?Authorization=${accessToken}`);

        socket.onopen = () => {
            console.log('✅ Connected to WebSocket');
            set({
                connectionState: CONNECTION_STATES.CONNECTED,
                socket,
                error: null
            });
        };

        socket.onmessage = (event) => {
            console.log('📩 Message received:', event.data);

            // Parse message or use raw text
            let messageData;
            try {
                messageData = JSON.parse(event.data);
                if (messageData?.requestId) {
                    // Check if this is an error response using multiple criteria
                    const isError = messageData.error || 
                                  messageData.statusCode >= 400 ||
                                  messageData.message?.toLowerCase().includes('error') ||
                                  messageData.success === false;
                    
                    if (isError) {
                        const errorMessage = messageData.error || 
                                           messageData.message || 
                                           `Server error (${messageData.statusCode || 'unknown'})`;
                        console.error('❌ Server error response:', errorMessage);
                        get().rejectPendingRequest(messageData.requestId, new Error(errorMessage));
                    } else {
                        // Success response
                        console.log('✅ Server success response:', messageData);
                        get().resolvePendingRequest(messageData.requestId, messageData);
                    }
                    return; // Skip regular push handling
                }
            } catch {
                console.error('Failed to parse message, using raw text:', event.data);
            }

            // Add to messages array
            set(state => ({
                messages: [...state.messages, {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    ...messageData
                }]
            }));
        };

        socket.onclose = () => {
            console.log('❌ WebSocket disconnected');
            // Reject all pending requests when connection closes
            get().rejectAllPendingRequests('Connection closed');
            set({
                connectionState: CONNECTION_STATES.DISCONNECTED,
                socket: null
            });
        };

        socket.onerror = (error) => {
            console.error('⚠️ WebSocket error:', error);
            set({
                error: 'Connection error',
                connectionState: CONNECTION_STATES.DISCONNECTED
            });
        };
    },

    // Disconnect
    disconnect: () => {
        const { socket, connectionState } = get();

        // Don't disconnect if already disconnected
        if (connectionState === CONNECTION_STATES.DISCONNECTED) {
            return;
        }

        if (socket) {
            socket.close();
        }

        set({
            connectionState: CONNECTION_STATES.DISCONNECTED,
            socket: null
        });
    },

    // Send message
    sendMessage: (message) => {
        const { socket, connectionState } = get();

        if (connectionState !== CONNECTION_STATES.CONNECTED || !socket) {
            console.warn('Cannot send message: not connected');
            return false;
        }

        try {
            const messageString = typeof message === 'string'
                ? message
                : JSON.stringify(message);

            socket.send(messageString);
            console.log('📤 Message sent:', message);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    },

    // Clear messages
    clearMessages: () => {
        set({ messages: [] });
    },

    //Simulate asynchronous request/response
    pendingRequests: {},
    addPendingRequest: (id, resolve, reject, timeout = 30000) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timeout'));
            delete get().pendingRequests[id];
        }, timeout);
        
        get().pendingRequests[id] = { resolve, reject, timeoutId };
    },
    resolvePendingRequest: (id, payload) => {
        const request = get().pendingRequests[id];
        if (request) {
            clearTimeout(request.timeoutId);
            request.resolve(payload);
            delete get().pendingRequests[id];
        }
    },
    rejectPendingRequest: (id, error) => {
        const request = get().pendingRequests[id];
        if (request) {
            clearTimeout(request.timeoutId);
            request.reject(error);
            delete get().pendingRequests[id];
        }
    },
    rejectAllPendingRequests: (error) => {
        const requests = get().pendingRequests;
        Object.keys(requests).forEach(id => {
            get().rejectPendingRequest(id, new Error(error));
        });
    },

    sendMessageWithAck: (action, data = {}, timeout = 30000) => {
        return new Promise((resolve, reject) => {
            const { connectionState } = get();
            
            if (connectionState !== CONNECTION_STATES.CONNECTED) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const requestId = `${Date.now()}-${Math.random()}`;
            const payload = {
                action,
                ...data,
                requestId,
            };

            get().addPendingRequest(requestId, resolve, reject, timeout);

            const sent = get().sendMessage(payload);
            if (!sent) {
                get().rejectPendingRequest(requestId, new Error('Failed to send message'));
            }
        });
    },

    // Helper functions
    isConnected: () => get().connectionState === CONNECTION_STATES.CONNECTED,
    isConnecting: () => get().connectionState === CONNECTION_STATES.CONNECTING,
})));

export default useSimpleWebSocketStore;
