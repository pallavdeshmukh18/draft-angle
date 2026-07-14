import React from "react";

export default function AnimatedBackground() {
    return (
        <div className="auth-animated-bg">
            <div className="floating-shape shape-1">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <path d="M 50 10 L 90 35 L 90 75 L 50 90 L 10 75 L 10 35 Z" fill="none" stroke="rgba(124,154,122,0.06)" strokeWidth="1" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(124,154,122,0.06)" strokeWidth="1" />
                    <line x1="50" y1="50" x2="90" y2="35" stroke="rgba(124,154,122,0.06)" strokeWidth="1" />
                    <line x1="50" y1="50" x2="10" y2="35" stroke="rgba(124,154,122,0.06)" strokeWidth="1" />
                </svg>
            </div>
            
            <div className="floating-shape shape-2">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(124,154,122,0.08)" strokeWidth="1" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(124,154,122,0.05)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(124,154,122,0.05)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <polygon points="50,15 85,75 15,75" fill="none" stroke="rgba(124,154,122,0.06)" strokeWidth="1" />
                </svg>
            </div>

            <div className="floating-shape shape-3">
                <svg viewBox="0 0 120 100" width="100%" height="100%">
                    {/* Caliper or dimension line template */}
                    <line x1="10" y1="50" x2="110" y2="50" stroke="rgba(124,154,122,0.07)" strokeWidth="1" />
                    <line x1="10" y1="40" x2="10" y2="60" stroke="rgba(124,154,122,0.07)" strokeWidth="1" />
                    <line x1="110" y1="40" x2="110" y2="60" stroke="rgba(124,154,122,0.07)" strokeWidth="1" />
                    <path d="M 10 50 L 20 46 L 20 54 Z" fill="rgba(124,154,122,0.07)" />
                    <path d="M 110 50 L 100 46 L 100 54 Z" fill="rgba(124,154,122,0.07)" />
                    <text x="60" y="42" textAnchor="middle" fontSize="8" fill="rgba(124,154,122,0.2)" fontFamily="monospace">DRAFT &lt; 2.5°</text>
                </svg>
            </div>

            <div className="floating-shape shape-4">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="rgba(124,154,122,0.04)" strokeWidth="1" />
                    <rect x="35" y="35" width="30" height="30" rx="5" fill="none" stroke="rgba(124,154,122,0.04)" strokeWidth="1" />
                    <line x1="20" y1="20" x2="35" y2="35" stroke="rgba(124,154,122,0.04)" strokeWidth="1" />
                    <line x1="80" y1="20" x2="65" y2="35" stroke="rgba(124,154,122,0.04)" strokeWidth="1" />
                    <line x1="20" y1="80" x2="35" y2="65" stroke="rgba(124,154,122,0.04)" strokeWidth="1" />
                    <line x1="80" y1="80" x2="65" y2="65" stroke="rgba(124,154,122,0.04)" strokeWidth="1" />
                </svg>
            </div>
        </div>
    );
}
