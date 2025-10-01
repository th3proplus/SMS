import React, { useState, useEffect } from 'react';
import { isAuthenticated } from '../services/authService';
import { navigate } from '../services/navigationService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // Use state to ensure the check is run once and the component's decision is stable
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const isAuth = isAuthenticated();
        setIsAuthorized(isAuth);
        
        if (!isAuth) {
            navigate('/login');
        }
    }, []); // Empty dependency array means this runs only once when the component mounts

    // While checking, render nothing to avoid flicker
    if (isAuthorized === null) {
        return null;
    }
    
    // If authorized, render the children. Otherwise, the effect has already triggered a redirect,
    // and rendering null prevents the children from flashing on screen.
    return isAuthorized ? <>{children}</> : null;
};

export default ProtectedRoute;
