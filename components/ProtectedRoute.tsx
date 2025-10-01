import React from 'react';
import { isAuthenticated } from '../services/authService';
import { navigate } from '../services/navigationService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // Perform the authentication check synchronously on every render.
    if (isAuthenticated()) {
        return <>{children}</>;
    }
    
    // If not authenticated, we need to navigate away.
    // To avoid causing a side-effect directly within the render function (which is bad practice
    // and can cause issues with React's Strict Mode), we schedule the navigation to run
    // in a microtask. This ensures it executes immediately after the current render cycle is complete.
    queueMicrotask(() => {
        navigate('/login', { replace: true });
    });

    // Render nothing for this component, as the navigation will take over.
    return null;
};

export default ProtectedRoute;