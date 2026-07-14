import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute({ children, onViewChange }) {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            onViewChange("login");
        }
    }, [user, loading, onViewChange]);

    if (loading) {
        return (
            <div className="auth-loading-screen">
                <div className="apple-spinner-container">
                    <svg className="apple-spinner-svg" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                    </svg>
                </div>
                <p className="auth-loading-text">Verifying secure credentials...</p>
            </div>
        );
    }

    return user ? children : null;
}
