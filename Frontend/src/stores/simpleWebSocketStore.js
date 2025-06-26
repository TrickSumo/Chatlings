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
            } catch {
                messageData = { type: 'text', data: event.data };
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

    // Helper functions
    isConnected: () => get().connectionState === CONNECTION_STATES.CONNECTED,
    isConnecting: () => get().connectionState === CONNECTION_STATES.CONNECTING,
})));

export default useSimpleWebSocketStore;
