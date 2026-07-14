import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthCard from "../components/AuthCard.jsx";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";

export default function Register({ onViewChange }) {
    const { 
        register, 
        error, 
        clearError,
        loginWithGoogle,
        handleGoogleError,
        handleGoogleCancel,
        handleGoogleStart
    } = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // Dynamic password strength evaluator
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { label: "None", score: 0, color: "#e2e8f0" };
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[a-z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        if (score <= 2) return { label: "Weak", score, color: "#ef4444" };
        if (score <= 4) return { label: "Medium", score, color: "#f59e0b" };
        return { label: "Strong", score, color: "#10b981" };
    };

    const strength = getPasswordStrength(password);

    const validate = () => {
        const errors = {};
        if (!fullName.trim()) {
            errors.fullName = "Full name is required";
        }
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.email = "Please enter a valid email address";
        }
        if (!password) {
            errors.password = "Password is required";
        } else if (strength.label === "Weak" || password.length < 8) {
            errors.password = "Password must be at least 8 characters and meet security strength standards";
        }
        if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        if (!termsAccepted) {
            errors.terms = "You must agree to the Terms of Service";
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
            await register(fullName, email, password);
            setRegisterSuccess(true);
        } catch (err) {
            // Error is managed by AuthContext and will be displayed via 'error'
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <AuthCard>
                <AnimatePresence mode="wait">
                    {!registerSuccess ? (
                        <motion.div
                            key="register-form"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="auth-header">
                                <button onClick={() => onViewChange("landing")} className="auth-back-btn">
                                    ← Back to Home
                                </button>
                                <h2 className="auth-title">Create your Workspace</h2>
                                <p className="auth-subtitle font-sm">Set up secure casting draft diagnostics.</p>
                            </div>

                            {(error || Object.keys(formErrors).length > 0) && (
                                <div className="auth-alert-panel error">
                                    <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>{error || Object.values(formErrors)[0]}</span>
                                </div>
                            )}

                             {/* Google Sign-In above the form */}
                             <GoogleLoginButton
                                 onStart={handleGoogleStart}
                                 onSuccess={loginWithGoogle}
                                 onError={handleGoogleError}
                                 onCancel={handleGoogleCancel}
                                 disabled={submitting}
                             />

                             <div className="auth-divider-google">
                                 <span className="divider-line"></span>
                                 <span className="divider-text">OR</span>
                                 <span className="divider-line"></span>
                             </div>

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="Alex Mercer"
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(e.target.value);
                                            if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: "" }));
                                        }}
                                        className={formErrors.fullName ? "input-error" : ""}
                                        disabled={submitting}
                                    />
                                </div>

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
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min 8 characters, numbers & symbols"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (formErrors.password) setFormErrors(prev => ({ ...prev, password: "" }));
                                            }}
                                            className={formErrors.password ? "input-error" : ""}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={submitting}
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Password strength UI */}
                                    {password && (
                                        <div className="pwd-strength-container">
                                            <div className="pwd-strength-bar">
                                                <div 
                                                    className="pwd-strength-fill"
                                                    style={{ 
                                                        width: `${(strength.score / 5) * 100}%`,
                                                        backgroundColor: strength.color 
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="pwd-strength-text" style={{ color: strength.color }}>
                                                Complexity: {strength.label}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Re-type password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
                                        }}
                                        className={formErrors.confirmPassword ? "input-error" : ""}
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="form-options">
                                    <label className="remember-me-checkbox terms-chk">
                                        <input
                                            type="checkbox"
                                            checked={termsAccepted}
                                            onChange={(e) => {
                                                setTermsAccepted(e.target.checked);
                                                if (formErrors.terms) setFormErrors(prev => ({ ...prev, terms: "" }));
                                            }}
                                            disabled={submitting}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span>
                                            I agree to the{" "}
                                            <span className="chk-link" onClick={(e) => { e.preventDefault(); alert("Terms read: Calculations are advisory only. Foundries remain responsible for structural casting outputs."); }}>
                                                Terms of Service
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    className="auth-btn-primary" 
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="btn-loading-flex">
                                            <svg className="btn-spinner" viewBox="0 0 50 50">
                                                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                                            </svg>
                                            Creating Workspace...
                                        </span>
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                             <div className="auth-footer-link">
                                Already registered?{" "}
                                <button onClick={() => onViewChange("login")} className="text-btn">
                                    Sign in to your Workspace
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Success Animation */
                        <motion.div
                            key="register-success"
                            className="auth-success-screen"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="success-lottie-mock">
                                <motion.svg 
                                    className="success-checkmark" 
                                    viewBox="0 0 52 52"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                                >
                                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"></circle>
                                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
                                </motion.svg>
                            </div>
                            <h3>Workspace Created!</h3>
                            <p>Establishing your credentials and booting design console...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AuthCard>
        </AuthLayout>
    );
}
