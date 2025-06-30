import { getAccessToken, API_URL } from "./utils";

const createHeaders = () => {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
    };
}


export const getSignedCookie = async (id) => {
    const response = await fetch(`${API_URL}/api/getSignedCookie`,
        {
            method: "GET",
            headers: createHeaders(),
            credentials: 'include'
        },
    );
    return response.json();
};