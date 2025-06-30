import { useEffect, useState } from 'react';
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";
import { getSignedCookie } from '../utils/apis';

const Auth = () => {
    const [message, setMessage] = useState("Authenticating...");
    const { isAuthenticated } = useAuth();
    let navigate = useNavigate();
    useEffect(() => {
        const fetchIdentityId = async () => {
            try {
                const res = await getSignedCookie();
                if (res.message !== "Cookies created successfully!") {
                    throw new Error("Failed to get signed cookies");
                }
                navigate("/app");
            }
            catch (err) {
                setMessage("Failed to get signed cookies");
                console.error(err);
                setTimeout(() => {
                    navigate("/");
                }, 9000);
            }
        }
        if (isAuthenticated) fetchIdentityId();
    }, [isAuthenticated])
    return (
         <div>{message}</div>
    )
}

export default Auth