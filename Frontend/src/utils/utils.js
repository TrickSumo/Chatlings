const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const VITE_WSS_API_STAGE = import.meta.env.VITE_WSS_API_STAGE || "production";

export const WSS_API_BASE_URL = `wss://${API_BASE_URL}/${VITE_WSS_API_STAGE}/`;
export const API_URL = `https://${API_BASE_URL}`;


export const getAccessToken = () => {
    const sessionStoragKeys = Object.keys(sessionStorage);
    const oidcKey = sessionStoragKeys.find(key => key.startsWith("oidc.user:https://cognito-idp."));
    const oidcContext = JSON.parse(sessionStorage.getItem(oidcKey) || "{}");
    const accessToken = oidcContext?.access_token;
    return accessToken;
};

export const deleteAccessToken = () => {
    const sessionStoragKeys = Object.keys(sessionStorage);
    const oidcKey = sessionStoragKeys.find(key => key.startsWith("oidc.user:https://cognito-idp."));
    sessionStorage.removeItem(oidcKey);
}

export const getUserDetails = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return null;
    }
    const payload = accessToken.split('.')[1];
    const decodedPayload = atob(payload);
    const userDetails = JSON.parse(decodedPayload);
    return userDetails;
}

export const generateUniqueKey = (file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${timestamp}_${randomString}_${sanitizedFileName}`;
}

