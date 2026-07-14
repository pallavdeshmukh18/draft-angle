import React, { createContext, useState, useEffect } from "react";
import { registerUser, loginUser, logoutUser, getMe } from "../services/auth.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children, onViewChange }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    const refreshAuth = async () => {
        setLoading(true);
        try {
            const data = await getMe();
            if (data?.user) {
                setUser(data.user);
                if (onViewChange) onViewChange("advisor");
                return data.user;
            }
            setUser(null);
            return null;
        } catch (err) {
            setUser(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Load initial user session on browser refresh
    useEffect(() => {
        refreshAuth().catch(() => {});
    }, [onViewChange]);

    const register = async (fullName, email, password) => {
        setLoading(true);
        setAuthError("");
        try {
            const data = await registerUser(fullName, email, password);
            setUser(data.user);
            if (onViewChange) onViewChange("advisor");
            return data.user;
        } catch (err) {
            setAuthError(err.message || "Failed to register account.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        setAuthError("");
        try {
            const data = await loginUser(email, password);
            setUser(data.user);
            if (onViewChange) onViewChange("advisor");
            return data.user;
        } catch (err) {
            setAuthError(err.message || "Failed to log in.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await logoutUser();
            setUser(null);
            if (onViewChange) onViewChange("landing");
        } catch (err) {
            console.error("Logout failed:", err);
            // Even if network fails, reset local user state to protect layout
            setUser(null);
            if (onViewChange) onViewChange("landing");
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setAuthError("");

    const loginWithGoogle = async () => {
        setLoading(true);
        setAuthError("");
        try {
            // Wait briefly (500ms) for the browser to sync cookies set by the popup window into the parent cookie store
            await new Promise((resolve) => setTimeout(resolve, 500));
            
            let userProfile = await refreshAuth();
            if (!userProfile) {
                // Retry once more after another 500ms in case of slower browser sync latency
                console.log("Initial session retrieval failed. Retrying in 500ms...");
                await new Promise((resolve) => setTimeout(resolve, 500));
                userProfile = await refreshAuth();
                
                if (!userProfile) {
                    throw new Error("Failed to retrieve user profile after successful authentication.");
                }
            }
            return userProfile;
        } catch (err) {
            setAuthError(err.message || "Failed to load user profile after Google Sign-In.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (errorMsg) => {
        setAuthError(errorMsg);
        setLoading(false);
    };

    const handleGoogleCancel = () => {
        setAuthError("Google Sign-In was cancelled.");
        setLoading(false);
    };

    const handleGoogleStart = () => {
        setLoading(true);
        setAuthError("");
    };

    const value = {
        user,
        loading,
        error: authError,
        register,
        login,
        loginWithGoogle,
        refreshAuth,
        handleGoogleError,
        handleGoogleCancel,
        handleGoogleStart,
        logout,
        clearError
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
