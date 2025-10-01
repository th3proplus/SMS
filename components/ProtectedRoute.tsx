import React, { useEffect } from 'react';
import { isAuthenticated } from '../services/authService';
import { navigate } from '../services/navigationService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // Check authentication status on every render.
    // This is a fast operation and ensures the component always has the latest status.
    const isAuth = isAuthenticated();

    // Use an effect to handle the navigation side-effect.
    // This will run if the component renders and the user is not authenticated.
    useEffect(() => {
        if (!isAuth) {
            navigate('/login');
        }
    }, [isAuth]); // Re-run the effect if isAuth changes.

    // Render children only if authenticated. Otherwise, render null while the
    // effect above triggers the navigation to the login page.
    return isAuth ? <>{children}</> : null;
};

export default ProtectedRoute;