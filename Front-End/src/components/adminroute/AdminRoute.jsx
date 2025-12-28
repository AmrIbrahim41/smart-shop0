import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    
    const getUserInfo = () => {
        try {
            const storedInfo = localStorage.getItem('userInfo');
            return storedInfo ? JSON.parse(storedInfo) : null;
        } catch (error) {
            console.error("Error parsing user info from local storage:", error);
            localStorage.removeItem('userInfo');
            return null;
        }
    };

    const userInfo = getUserInfo();

    if (userInfo && userInfo.isAdmin) {
        return children ? children : <Outlet />;
    } else {
        return <Navigate to="/login" replace />;
    }
};

export default AdminRoute;