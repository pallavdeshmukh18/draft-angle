import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthCard from "../components/AuthCard.jsx";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";

export default function Login({ onViewChange }) {
    const { 
        login, 
        error, 
        clearError,
        loginWithGoogle,
        handleGoogleError,
        handleGoogleCancel,
        handleGoogleStart
    } = useAuth();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const validate = () => {
        const errors = {};
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.email = "Please enter a valid email address";
        }
        if (!password) {
            errors.password = "Password is required";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        
        if (!validate()) return;
        
        setSubmitting(true);
        try {
            await login(email, password);
            setLoginSuccess(true);
        } catch (err) {
            // Error is managed by AuthContext and will be displayed via 'error'
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <AuthCard>
                <div className="auth-header">
                    <button onClick={() => onViewChange("landing")} className="auth-back-btn">
                        ← Back to Home
                    </button>
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Continue engineering with confidence.</p>
                </div>

                <AnimatePresence mode="wait">
                    {(error || Object.keys(formErrors).length > 0) && (
                        <motion.div 
                            className="auth-alert-panel error"
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error || Object.values(formErrors)[0]}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Google Sign-In above the form */}
                <GoogleLoginButton
                    onStart={handleGoogleStart}
                    onSuccess={loginWithGoogle}
                    onError={handleGoogleError}
                    onCancel={handleGoogleCancel}
                    disabled={submitting || loginSuccess}
                />

                <div className="auth-divider-google">
                    <span className="divider-line"></span>
                    <span className="divider-text">OR</span>
                    <span className="divider-line"></span>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => {
                                  setEmail(e.target.value);
                                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" }));
                            }}
                            className={formErrors.email ? "input-error" : ""}
                            disabled={submitting || loginSuccess}
                        />
                    </div>

                    <div className="input-group">
                        <div className="label-row">
                            <label htmlFor="password">Password</label>
                            <button 
                                type="button" 
                                className="forgot-pwd-link"
                                onClick={() => alert("Password reset functionality is under maintenance. Please contact your foundry administrator.")}
                                disabled={submitting || loginSuccess}
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: "" }));
                                }}
                                className={formErrors.password ? "input-error" : ""}
                                disabled={submitting || loginSuccess}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={submitting || loginSuccess}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me-checkbox">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={submitting || loginSuccess}
                            />
                            <span className="checkbox-custom"></span>
                            Remember me
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="auth-btn-primary" 
                        disabled={submitting || loginSuccess}
                    >
                        {submitting ? (
                            <span className="btn-loading-flex">
                                <svg className="btn-spinner" viewBox="0 0 50 50">
                                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                                </svg>
                                Authenticating...
                            </span>
                        ) : loginSuccess ? (
                            "Success"
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="auth-footer-link">
                    New to the platform?{" "}
                    <button onClick={() => onViewChange("register")} className="text-btn">
                        Create an Engineering Workspace
                    </button>
                </div>
            </AuthCard>
        </AuthLayout>
    );
}
