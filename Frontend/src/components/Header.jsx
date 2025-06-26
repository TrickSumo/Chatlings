import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { deleteAccessToken } from '../utils/utils';
import styles from './Header.module.css';
import useSimpleWebSocket from '../hooks/useSimpleWebSocket';
import useSimpleWebSocketStore, { CONNECTION_STATES } from '../stores/simpleWebSocketStore';

const congitoUserPoolClientID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const cognitoUserPoolDomain = import.meta.env.VITE_COGNITO_USER_POOL_DOMAIN;

const Header = () => {
    const navigate = useNavigate();
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeout = useRef(null);

    const { isConnected, isConnecting, connect, disconnect, getStatus } = useSimpleWebSocket();

    const signOutRedirect = () => {
        deleteAccessToken();
        const clientId = congitoUserPoolClientID;
        const logoutUri = window.location.origin;
        const cognitoDomain = cognitoUserPoolDomain;
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    const getConnectionStatus = () => {
        const status = getStatus();
        return <>{status.icon} {status.text}</>
    }

    // Initial connection
    useEffect(() => {
        if (!isConnected && !isConnecting) {
            console.log('🔌 Header: Starting initial connection...');
            connect();
        }
    }, []); // Only run once on mount

    // Subscribe to connection state changes for reconnection logic
    useEffect(() => {
        const unsubscribe = useSimpleWebSocketStore.subscribe(
            (state) => state.connectionState,
            (connectionState, previousConnectionState) => {
                console.log(`🔄 Header: Connection state changed from ${previousConnectionState} to ${connectionState}`);
                
                // Handle disconnection (attempt reconnect)
                if (connectionState === CONNECTION_STATES.DISCONNECTED && 
                    previousConnectionState === CONNECTION_STATES.CONNECTED) {
                    
                    console.log(`🔌 Header: Connection lost, attempting reconnect (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
                    
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        // Clear any existing timeout
                        if (reconnectTimeout.current) {
                            clearTimeout(reconnectTimeout.current);
                        }
                        
                        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                        
                        reconnectTimeout.current = setTimeout(() => {
                            reconnectAttempts.current++;
                            connect();
                        }, delay);
                    } else {
                        console.log('❌ Header: Max reconnection attempts reached');
                        reconnectAttempts.current = 0; // Reset for future attempts
                    }
                }
                
                // Reset reconnect attempts on successful connection
                if (connectionState === CONNECTION_STATES.CONNECTED) {
                    console.log('✅ Header: Successfully connected, resetting reconnect attempts');
                    reconnectAttempts.current = 0;
                    if (reconnectTimeout.current) {
                        clearTimeout(reconnectTimeout.current);
                        reconnectTimeout.current = null;
                    }
                }
            }
        );

        // Cleanup function
        return () => {
            unsubscribe();
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, []); // Empty dependency array - subscription only needs to be set up once

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerIcons} onClick={() => navigate("/")}>🏠</div>
                <div>{getConnectionStatus()}</div>
                <div className={styles.headerIcons} onClick={signOutRedirect}>👋🏽</div>
            </div>
        </>
    );
}

export default Header