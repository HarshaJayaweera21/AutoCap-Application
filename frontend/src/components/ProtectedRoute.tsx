import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: string;
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const token = getCookie('token');
    const role = getCookie('role');

    // No token → redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Role mismatch → show access denied
    if (requiredRole && role?.toUpperCase() !== requiredRole.toUpperCase()) {
        return <Navigate to="/access-denied" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
