import React from "react";
import AnimatedBackground from "./AnimatedBackground.jsx";

export default function AuthLayout({ children }) {
    return (
        <div className="auth-layout-container">
            <AnimatedBackground />
            <div className="auth-content-scroller">
                <main className="auth-main-wrapper">
                    {children}
                </main>
            </div>
        </div>
    );
}
