import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ReactNode } from 'react';

export default function RequireTeacher({ children }: { children: ReactNode }) {
    const { isAuthenticated, isTeacher } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !isTeacher) {
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }

    return children;
}
