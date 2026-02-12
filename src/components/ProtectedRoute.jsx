import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

/**
 * Higher Order Component to protect routes from unauthenticated access.
 * If the user is not logged in (no authToken) and not a guest (no userRole === 'GUEST'),
 * they are redirected to the login page.
 */
const ProtectedRoute = ({ children }) => {
    const { authToken, userRole, isLoading } = useAppContext();
    const location = useLocation();

    // If no token and not a guest, redirect to login
    if (!authToken && userRole !== 'GUEST') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
