import React, { useEffect } from 'react';
import { isAuthenticated } from '../services/authService';
import { navigate } from '../services/navigationService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, []);

    if (!isAuthenticated()) {
        // Render nothing while redirecting
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;