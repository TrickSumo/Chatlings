import React from 'react'
import { useNavigate } from 'react-router-dom';
import { deleteAccessToken } from '../utils/utils';
import styles from './Header.module.css';

const congitoUserPoolClientID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const cognitoUserPoolDomain = import.meta.env.VITE_COGNITO_USER_POOL_DOMAIN;

const Header = () => {
    const navigate = useNavigate();

    const signOutRedirect = () => {
        deleteAccessToken();
        const clientId = congitoUserPoolClientID;
        const logoutUri = window.location.origin;
        const cognitoDomain = cognitoUserPoolDomain;
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };
    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerIcons} onClick={() => navigate("/")}>🏠</div>
                <div className={styles.headerIcons} onClick={signOutRedirect}>👋🏽</div>
            </div>
        </>
    );
}

export default Header