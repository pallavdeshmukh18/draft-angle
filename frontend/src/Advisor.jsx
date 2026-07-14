import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./hooks/useAuth.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialForm = {
    geometryComplexity: "Simple",
    wallDepthMm: 20,
    surfaceType: "External",
    surfaceFinishRequirement: "Standard",
    material: "Aluminium alloy",
    dieEjectionConditions: "Moderate"
};

const complexityOptions = ["Simple", "Medium", "Complex"];
const surfaceTypeOptions = ["Internal", "External"];

// Premium Info Tooltip Helper
const Tooltip = ({ text }) => {
    return (
        <span className="info-tooltip-trigger">
            ⓘ
            <span className="tooltip-bubble">{text}</span>
        </span>
    );
};

// Segmented Control Component
const SegmentedControl = ({ options, value, onChange, name, disabled }) => {
    return (
        <div className="segmented-control">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    className={`segment-btn ${value === option ? "active" : ""}`}
                    onClick={() => onChange({ target: { name, value: option } })}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};

// Tactile Finish Selection Cards using Vector SVGs
const FinishSelectionCards = ({ value, onChange, disabled }) => {
    const options = [
        { 
            key: "Standard", 
            label: "Standard", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
            )
        },
        { 
            key: "Fine", 
            label: "Fine", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
            )
        },
        { 
            key: "Polished", 
            label: "Polished", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                </svg>
            )
        },
        { 
            key: "Textured", 
            label: "Textured", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M18 3L3 18 M21 9L9 21 M15 3L3 15" />
                </svg>
            )
        }
    ];
    return (
        <div className="tactile-card-row">
            {options.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    disabled={disabled}
                    className={`tactile-card ${value === opt.key ? "active" : ""}`}
                    onClick={() => onChange({ target: { name: "surfaceFinishRequirement", value: opt.key } })}
                >
                    <span className="tactile-card-icon">{opt.icon}</span>
                    <span className="tactile-card-lbl">{opt.label}</span>
                </button>
            ))}
        </div>
    );
};

// Tactile Ejection Selection Cards using Vector SVGs
const EjectionSelectionCards = ({ value, onChange, disabled }) => {
    const options = [
        { 
            key: "Easy", 
            label: "Easy Ejection", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )
        },
        { 
            key: "Moderate", 
            label: "Moderate Force", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 12L16 8" />
                </svg>
            )
        },
        { 
            key: "Difficult", 
            label: "High Resistance", 
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-svg-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            )
        }
    ];
    return (
        <div className="tactile-card-row three-cols">
            {options.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    disabled={disabled}
                    className={`tactile-card ${value === opt.key ? "active" : ""}`}
                    onClick={() => onChange({ target: { name: "dieEjectionConditions", value: opt.key } })}
                >
                    <span className="tactile-card-icon">{opt.icon}</span>
                    <span className="tactile-card-lbl">{opt.label}</span>
                </button>
            ))}
        </div>
    );
};

// Lightweight Regex-based Markdown Formatter Supporting Bold, Bullet Lists and Markdown Tables
const formatMarkdown = (text) => {
    if (!text) return "";
    
    // Split block content by double newlines
    const blocks = text.split("\n\n");
    const formattedBlocks = blocks.map(block => {
        const trimmed = block.trim();
        
        // 1. Table Detection & Formatting
        if (trimmed.startsWith("|") && trimmed.includes("\n|")) {
            const rows = trimmed.split("\n");
            // Map cells, filtering empty cell spaces around table borders
            const header = rows[0].split("|").map(x => x.trim()).filter((x, i) => i > 0 && i < rows[0].split("|").length - 1);
            const dataRows = rows.slice(2).map(row => 
                row.split("|").map(x => x.trim()).filter((x, i) => i > 0 && i < row.split("|").length - 1)
            ).filter(r => r.length > 0);

            const thead = `<thead><tr>${header.map(h => `<th>${h}</th>`).join("")}</tr></thead>`;
            const tbody = `<tbody>${dataRows.map(r => `<tr>${r.map(td => `<td>${td}</td>`).join("")}</tr>`).join("")}</tbody>`;
            return `<div className="chat-table-wrapper"><table className="chat-markdown-table">${thead}${tbody}</table></div>`;
        }
        
        // 2. Unordered Bullet List Detection & Formatting
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const items = trimmed.split("\n").map(li => {
                const content = li.trim().replace(/^[\*\-]\s+/, "");
                const formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                return `<li>${formatted}</li>`;
            });
            return `<ul className="chat-markdown-list">${items.join("")}</ul>`;
        }

        // 3. Normal Paragraph Block with Inline Bold Tags
        let formatted = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        formatted = formatted.replace(/\n/g, "<br />");
        return `<p>${formatted}</p>`;
    });

    return formattedBlocks.join("");
};

const emptyStateChips = [
    "Why this recommendation?",
    "Can I reduce this draft?",
    "Improve ejection efficiency",
    "Compare with NADCA guidelines",
    "Reduce die wear",
    "Explain confidence score"
];

function Advisor({ onBack }) {
    const { user, logout } = useAuth();
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState("");
    const [expandAnalysis, setExpandAnalysis] = useState(false);

    // AI Engineering Assistant states
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState("");
    const [contextUpdated, setContextUpdated] = useState(false);
    const chatEndRef = useRef(null);

    // Interactive 3D CAD rotation variables
    const [rx, setRx] = useState(-0.4); // Pitch
    const [ry, setRy] = useState(0.5);  // Yaw
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, rx: 0, ry: 0 });

    // Live recommendation hook - updates progressively on input changes
    useEffect(() => {
        if (!API_BASE_URL) return;

        const submitFormLive = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(`${API_BASE_URL}/api/recommend-draft`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ...form,
                        wallDepthMm: Number(form.wallDepthMm)
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Unable to get recommendation");
                }
                setResult(data);
            } catch (submitError) {
                setError(submitError.message);
            } finally {
                setLoading(false);
            }
        };

        // Debounce by 250ms to ensure slider drag feels smooth without spamming backend
        const debounceTimer = setTimeout(() => {
            submitFormLive();
        }, 250);

        return () => clearTimeout(debounceTimer);
    }, [form]);

    // History log reloader - updates when a new recommendation settles
    useEffect(() => {
        const loadHistory = async () => {
            try {
                if (!API_BASE_URL) return;
                const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
                    credentials: "include"
                });
                if (!response.ok) return;
                const data = await response.json();
                setHistory(data.slice(0, 6));
            } catch {
                setHistory([]);
            }
        };

        loadHistory();
    }, [result]);

    // Context updated notification trigger - flashes active when parameters change
    useEffect(() => {
        if (result) {
            setContextUpdated(true);
            const timer = setTimeout(() => setContextUpdated(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    // Auto-scroll to the bottom of the chat conversation log
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, chatLoading]);

    // Slow rotation idle effect for CAD model
    useEffect(() => {
        if (isDragging) return;
        let frame;
        const animate = () => {
            setRy((prev) => prev + 0.0035);
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [isDragging]);

    // Reset conversation log when the primary recommendation output changes
    useEffect(() => {
        setChatMessages([]);
        setChatInput("");
        setChatError("");
    }, [result]);

    const onChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    // 3D drag interactions handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            rx,
            ry
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setRx(dragStart.current.rx - dy * 0.006);
        setRy(dragStart.current.ry + dx * 0.006);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        setIsDragging(true);
        dragStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            rx,
            ry
        };
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - dragStart.current.x;
        const dy = e.touches[0].clientY - dragStart.current.y;
        setRx(dragStart.current.rx - dy * 0.006);
        setRy(dragStart.current.ry + dx * 0.006);
    };

    // Send question to the Groq Engineering Assistant endpoint
    const sendChatMessage = async (msgText) => {
        if (!msgText.trim() || chatLoading || !result) return;

        const userMsg = { role: "user", content: msgText };
        setChatMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        setChatLoading(true);
        setChatError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    message: msgText,
                    currentRecommendation: result,
                    history: chatMessages
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to communicate with Assistant");
            }

            const assistantMsg = { role: "assistant", content: data.content };
            setChatMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            setChatError(err.message);
        } finally {
            setChatLoading(false);
        }
    };

    // Contextual follow-up suggestions generated dynamically
    const getSuggestions = () => {
        if (form.geometryComplexity === "Complex") {
            return ["Why not a smaller draft?", "How to reduce ejection wear?", "Detail standard NADCA rules"];
        }
        if (form.surfaceType === "Internal") {
            return ["Why do internal surfaces stick?", "How to avoid core galling?", "What is core shrinkage?"];
        }
        return ["Why not 2°?", "How to improve ejection efficiency?", "Detail residual casting risk"];
    };

    // CAD wireframe coordinates math
    const w = 56;
    const d = 56;
    const h = 46;
    const angleVal = result ? result.draftAngle : 1.5;
    // Visually scale small taper angles to make morphing visible on screen (4x multiplier)
    const exaggeratedAngle = Math.min(25, angleVal * 4.5);
    const tanVal = Math.tan((exaggeratedAngle * Math.PI) / 180);
    const offset = h * tanVal;
    const wt = w - 2 * offset;
    const dt = d - 2 * offset;

    const baseVertices = [
        { x: -w/2, y: -d/2, z: -h/2 }, // 0
        { x: w/2, y: -d/2, z: -h/2 },  // 1
        { x: w/2, y: d/2, z: -h/2 },   // 2
        { x: -w/2, y: d/2, z: -h/2 },  // 3
        { x: -wt/2, y: -dt/2, z: h/2 }, // 4
        { x: wt/2, y: -dt/2, z: h/2 },  // 5
        { x: wt/2, y: dt/2, z: h/2 },   // 6
        { x: -wt/2, y: dt/2, z: h/2 }   // 7
    ];

    // Center coordinates inside rendering box
    const cx = 100;
    const cy = 80;
    const projected = baseVertices.map((v) => {
        // Rotate Y (yaw)
        let x1 = v.x * Math.cos(ry) + v.z * Math.sin(ry);
        let z1 = -v.x * Math.sin(ry) + v.z * Math.cos(ry);
        let y1 = v.y;

        // Rotate X (pitch)
        let x2 = x1;
        let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);

        return {
            x: cx + x2,
            y: cy - y2
        };
    });

    const edges = [
        { from: 0, to: 1, type: "base" },
        { from: 1, to: 2, type: "base" },
        { from: 2, to: 3, type: "base" },
        { from: 3, to: 0, type: "base" },
        { from: 4, to: 5, type: "taper" },
        { from: 5, to: 6, type: "taper" },
        { from: 6, to: 7, type: "taper" },
        { from: 7, to: 4, type: "taper" },
        { from: 0, to: 4, type: "taper" },
        { from: 1, to: 5, type: "taper" },
        { from: 2, to: 6, type: "taper" },
        { from: 3, to: 7, type: "taper" }
    ];

    // Circular gauge calculations
    const r = 24;
    const circ = 2 * Math.PI * r;

    // Live Status Pill determination
    let statusText = "Recommended";
    let statusClass = "status-green";
    if (result) {
        if (result.risk && result.risk.length > 0) {
            statusText = "Requires Attention";
            statusClass = "status-amber";
        }
        if (result.confidence <= 65) {
            statusText = "High Risk";
            statusClass = "status-red";
        }
    }

    return (
        <div className="advisor-desktop-workspace">
            {/* Redesigned macOS-style Navigation Toolbar Header */}
            <header className="advisor-header premium-macos-navbar">
                <div className="advisor-nav-container">
                    {/* Left side: Logo + Name + Version */}
                    <div className="logo-group">
                        <svg className="logo-icon-svg" viewBox="0 0 24 24" fill="none">
                            <path d="M4 18L12 6L20 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 6V20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 3"/>
                        </svg>
                        <span className="logo-lbl">DraftAngle<span className="logo-sub">Advisor</span></span>
                        <span className="navbar-version-badge">v1.0</span>
                    </div>

                    {/* Center: Intentionally empty for negative space focus */}
                    <div className="navbar-center-empty"></div>

                    {/* Right side: Workspace Switcher -> Settings -> Profile Chip -> Sign Out */}
                    <div className="nav-actions-profile">
                        {onBack && (
                            <button onClick={onBack} className="btn-nav-landing">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="back-arrow-svg">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Landing
                            </button>
                        )}
                        
                        <button type="button" className="btn-nav-settings" title="Settings Preferences">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="settings-gear-svg">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                        
                        {user && (
                            <>
                                <button type="button" className="user-profile-chip" title="User Profile Details">
                                    <span className="profile-status-dot"></span>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="profile-avatar-image" />
                                    ) : (
                                        <span className="profile-avatar-circle">
                                            {user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                        </span>
                                    )}
                                    <span className="profile-chip-name">{user.fullName.split(" ")[0]}</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-chevron-svg">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                
                                <button onClick={logout} className="btn-nav-signout-quiet">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="signout-icon-svg">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Sign Out
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="advisor-shell">
                {/* Redesigned Premium Live Engineering CAD Hero Section */}
                <section className="advisor-hero-banner interactive-visualization-banner">
                    <div className="hero-banner-content">
                        <h1>Guided Assistant</h1>
                        
                        {result ? (
                            <div className="hero-live-recommendation-report">
                                <div className="hero-report-item">
                                    <span className="hero-report-lbl">Draft Angle</span>
                                    <strong className="hero-report-val">{result.draftAngle}°</strong>
                                </div>
                                <div className="hero-report-divider"></div>
                                <div className="hero-report-item">
                                    <span className="hero-report-lbl">Confidence</span>
                                    <strong className="hero-report-val">{result.confidence}%</strong>
                                </div>
                            </div>
                        ) : (
                            <div className="hero-live-recommendation-report placeholder-state">
                                <p>Awaiting parameters to construct casting wireframe...</p>
                            </div>
                        )}
                        
                        <p className="hero-banner-subtext">Recommendations update instantly as casting specifications change.</p>
                    </div>
                    
                    {/* Live rotating 3D CAD Wireframe illustration box */}
                    <div 
                        className="hero-cad-illustration interactive-cad-container"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                    >
                        <svg viewBox="0 0 200 160" width="100%" height="100%">
                            {/* Grid Ground Line */}
                            <g stroke="#ece9e2" strokeWidth="0.5" fill="none" opacity="0.6">
                                <line x1="20" y1="134" x2="180" y2="134" />
                                <line x1="20" y1="134" x2="68" y2="44" strokeDasharray="2 2" />
                            </g>
                            
                            {/* Projections lines */}
                            {edges.map((e, idx) => {
                                const p1 = projected[e.from];
                                const p2 = projected[e.to];
                                const isTaper = e.type === "taper";
                                return (
                                    <line
                                        key={idx}
                                        x1={p1.x}
                                        y1={p1.y}
                                        x2={p2.x}
                                        y2={p2.y}
                                        className={isTaper ? "cad-taper-edge" : "cad-base-edge"}
                                    />
                                );
                            })}

                            {/* Node vertex markers */}
                            {projected.map((p, idx) => (
                                <circle
                                    key={idx}
                                    cx={p.x}
                                    cy={p.y}
                                    r="1.8"
                                    className={idx >= 4 ? "cad-taper-node" : "cad-base-node"}
                                />
                            ))}

                            {/* Floating Angle Metric Overlay */}
                            <g transform="translate(10, 16)">
                                <rect x="0" y="0" width="80" height="34" rx="8" fill="#FAF9F6" stroke="#ECE9E2" strokeWidth="1" />
                                <text x="8" y="13" fontSize="6.5" fontFamily="monospace" fontWeight="700" fill="#a2a29c">TAPER ANGLE</text>
                                <text x="8" y="25" fontSize="10.5" fontFamily="sans-serif" fontWeight="800" fill="#7C9A7A">{angleVal.toFixed(1)}° Draft</text>
                            </g>
                        </svg>
                    </div>
                </section>

                {/* 40/60 Split Workspace columns */}
                <div className="workspace-columns-grid">
                    {/* Left: Parameter Builder (40% width) */}
                    <div className="parameter-builder-column">
                        {/* Section 1: Geometry */}
                        <div className="parameter-section-card">
                            <div className="sec-header">
                                <span className="sec-num">①</span>
                                <h3>Geometry Specification</h3>
                            </div>
                            
                            <div className="field-block">
                                <label>
                                    Geometry Complexity
                                    <Tooltip text="Complex contours raise drag, demanding a larger base angle taper specifications." />
                                </label>
                                <SegmentedControl
                                    name="geometryComplexity"
                                    options={complexityOptions}
                                    value={form.geometryComplexity}
                                    onChange={onChange}
                                    disabled={loading}
                                />
                            </div>

                            <div className="field-block">
                                <label>
                                    Wall Depth (mm)
                                    <Tooltip text="Deeper geometry draws increase friction, requiring step-wise increases in clearance tapers." />
                                </label>
                                <div className="modern-depth-slider-pair">
                                    <input
                                        type="range"
                                        name="wallDepthMm"
                                        min="5"
                                        max="100"
                                        step="1"
                                        value={form.wallDepthMm}
                                        onChange={(e) => onChange({ target: { name: "wallDepthMm", value: Number(e.target.value) } })}
                                        disabled={loading}
                                        className="ux-range-slider"
                                    />
                                    <div className="slider-stepper-box">
                                        <input
                                            type="number"
                                            name="wallDepthMm"
                                            min="1"
                                            max="200"
                                            value={form.wallDepthMm}
                                            onChange={(e) => onChange({ target: { name: "wallDepthMm", value: Math.max(1, Number(e.target.value)) } })}
                                            disabled={loading}
                                            className="stepper-box-input"
                                        />
                                        <span className="stepper-unit">mm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Surface */}
                        <div className="parameter-section-card">
                            <div className="sec-header">
                                <span className="sec-num">②</span>
                                <h3>Surface Diagnostics</h3>
                            </div>

                            <div className="field-block">
                                <label>
                                    Surface Orientation
                                    <Tooltip text="Internal cavities shrink onto core blocks, needing +0.5° premium clearings." />
                                </label>
                                <SegmentedControl
                                    name="surfaceType"
                                    options={surfaceTypeOptions}
                                    value={form.surfaceType}
                                    onChange={onChange}
                                    disabled={loading}
                                />
                            </div>

                            <div className="field-block">
                                <label>
                                    Surface Finish Requirement
                                    <Tooltip text="Fine or textured finishes require larger taper clearances to prevent scuff marks during drawing." />
                                </label>
                                <FinishSelectionCards
                                    value={form.surfaceFinishRequirement}
                                    onChange={onChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Section 3: Manufacturing */}
                        <div className="parameter-section-card">
                            <div className="sec-header">
                                <span className="sec-num">③</span>
                                <h3>Manufacturing Settings</h3>
                            </div>

                            <div className="field-block">
                                <label>
                                    Material Alloy Compound
                                    <Tooltip text="Different casting metals (aluminium vs zinc) contract at varying cooling indices." />
                                </label>
                                <input
                                    name="material"
                                    value={form.material}
                                    onChange={onChange}
                                    disabled={loading}
                                    className="custom-app-text-input"
                                    placeholder="e.g. Aluminium alloy A380"
                                />
                            </div>

                            <div className="field-block">
                                <label>
                                    Die Ejection Conditions
                                    <Tooltip text="Mechanical assist systems dictate allowable draw resistance forces." />
                                </label>
                                <EjectionSelectionCards
                                    value={form.dieEjectionConditions}
                                    onChange={onChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Recommendation (60% width) */}
                    <div className="live-recommendation-column">
                        <div className="recommendation-hero-card">
                            <div className="panel-headline-row">
                                <div className="headline-meta-row">
                                    <h2>Live Recommendation</h2>
                                    {loading && <span className="live-thinking-indicator">Evaluating inputs...</span>}
                                </div>
                                <p>Calculation specification matches optimal casting draw criteria.</p>
                            </div>

                            <AnimatePresence mode="wait">
                                {result ? (
                                    <motion.div 
                                        key="result-present"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: loading ? 0.6 : 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="recommendation-grid-block"
                                    >
                                        {/* Focal Point Draft Angle */}
                                        <div className="focal-draft-card">
                                            <div className="draft-big-value">
                                                <strong className="huge-angle">{result.draftAngle}°</strong>
                                                <span className="angle-lbl">Recommended Draft</span>
                                            </div>
                                            
                                            {/* Dynamic Status Pill */}
                                            <div className={`status-pill ${statusClass}`}>
                                                <span className="status-dot"></span>
                                                {statusText}
                                            </div>
                                        </div>

                                        {/* Progressive Disclosure Section: Confidence Breakdown */}
                                        <div className="confidence-breakdown-row">
                                            <div className="confidence-bar-wrapper">
                                                <div className="c-labels">
                                                    <span>Foundry Ejection Confidence</span>
                                                    <strong>{result.confidence}%</strong>
                                                </div>
                                                <div className="gauge-svg-line-track">
                                                    <div className="gauge-fill-accent" style={{ width: `${result.confidence}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Gauge Circle */}
                                            <div className="confidence-circular-gauge">
                                                <svg width="44" height="44" viewBox="0 0 56 56">
                                                    <circle cx="28" cy="28" r="24" className="gauge-bg" fill="none" strokeWidth="3" />
                                                    <circle 
                                                        cx="28" 
                                                        cy="28" 
                                                        r="24" 
                                                        className="gauge-progress" 
                                                        fill="none" 
                                                        strokeWidth="3" 
                                                        strokeDasharray={circ}
                                                        strokeDashoffset={circ - (circ * result.confidence) / 100}
                                                        strokeLinecap="round"
                                                        transform="rotate(-90 28 28)"
                                                    />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Diagnostic Chips (System Settings Indicator style) */}
                                        <div className="diagnostic-chips-group">
                                            <h4>System Diagnostics</h4>
                                            <div className="chips-row">
                                                {result.risk && result.risk.length > 0 ? (
                                                    result.risk.map((riskItem, idx) => (
                                                        <span key={idx} className="diagnostic-chip warn">
                                                            <span className="chip-icon">⚠</span>
                                                            {riskItem}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="diagnostic-chip success">
                                                        <span className="chip-icon">✓</span>
                                                        Easy Ejection Taper
                                                    </span>
                                                )}
                                                <span className="diagnostic-chip info">
                                                    <span className="chip-icon">ⓘ</span>
                                                    {form.geometryComplexity} Geometry
                                                </span>
                                                <span className="diagnostic-chip info">
                                                    <span className="chip-icon">ⓘ</span>
                                                    {form.surfaceType} Draft
                                                </span>
                                            </div>
                                        </div>

                                        {/* Apple Notes Collapsible Explanation */}
                                        <div className="explanation-apple-notes">
                                            <div className="notes-header">
                                                <svg className="notes-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                <span className="notes-badge">Engineering Explanation</span>
                                                <span className="notes-source-badge">{result.source}</span>
                                            </div>
                                            <p className="notes-body">
                                                {expandAnalysis 
                                                    ? result.explanation 
                                                    : `${result.explanation.split('.').slice(0, 2).join('.')}.`}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setExpandAnalysis(!expandAnalysis)}
                                                className="btn-accordion-toggle"
                                            >
                                                {expandAnalysis ? "Show Less" : "Expand Full Engineering Analysis"}
                                            </button>
                                        </div>
                                    </motion.div>
                                 ) : (
                                    <div className="placeholder-results-card">
                                        <div className="placeholder-visual">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                        </div>
                                        <h3>Awaiting parameters</h3>
                                        <p>Adjust the left geometry slider or select options to construct the live draw specification.</p>
                                    </div>
                                )}
                            </AnimatePresence>

                            {error && <div className="workspace-error-banner">{error}</div>}
                        </div>
                    </div>
                </div>

                {/* Apple Xcode/Logic Pro Redesigned Engineering Copilot */}
                <section className="assistant-full-card">
                    <div className="assistant-header-row">
                        <div className="assistant-title-group">
                            <span className="ai-badge">Copilot</span>
                            <h2>Engineering Assistant</h2>
                            <p className="assistant-subtitle">Ask questions about your current recommendation.</p>
                        </div>
                    </div>

                    {/* Embedded Context Report Summary Card */}
                    <div className="premium-rec-summary-card">
                        <div className="summary-card-header">
                            <span className="summary-card-title">Casting Taper Context</span>
                            <AnimatePresence>
                                {contextUpdated && (
                                    <motion.span 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="context-updated-badge"
                                    >
                                        <span className="dot-pulse"></span>
                                        Context Updated
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className="summary-grid">
                            <div className="summary-grid-item">
                                <span className="summary-item-label">Draft Angle</span>
                                <strong className="summary-item-value accent-text">{result ? `${result.draftAngle}°` : "—"}</strong>
                            </div>
                            <div className="summary-grid-item">
                                <span className="summary-item-label">Confidence</span>
                                <strong className="summary-item-value">{result ? `${result.confidence}%` : "—"}</strong>
                            </div>
                            <div className="summary-grid-item">
                                <span className="summary-item-label">Geometry</span>
                                <strong className="summary-item-value">{form.geometryComplexity}</strong>
                            </div>
                            <div className="summary-grid-item">
                                <span className="summary-item-label">Surface</span>
                                <strong className="summary-item-value">{form.surfaceType}</strong>
                            </div>
                            <div className="summary-grid-item">
                                <span className="summary-item-label">Wall Depth</span>
                                <strong className="summary-item-value">{form.wallDepthMm}mm</strong>
                            </div>
                            <div className="summary-grid-item">
                                <span className="summary-item-label">Material</span>
                                <strong className="summary-item-value truncate-text" title={form.material}>{form.material || "—"}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Quick Actions Pill Row */}
                    <div className="suggested-questions-row">
                        <div className="suggested-pills-scroll">
                            {emptyStateChips.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    disabled={!result}
                                    onClick={() => sendChatMessage(q)}
                                    className="suggested-question-pill"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Containerless Conversation Stream */}
                    <div className="assistant-conversation-container">
                        {chatMessages.length === 0 ? (
                            <div className="chat-empty-state">
                                <span className="empty-visual">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="empty-state-drawing">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
                                    </svg>
                                </span>
                                <p className="empty-state-text">Select a question above or ask your own below.</p>
                            </div>
                        ) : (
                            <div className="chat-messages-container">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`chat-message-bubble-wrapper ${msg.role}`}>
                                        <div className="message-text-bubble">
                                            <div className="message-content-p" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                                        </div>

                                        {/* Dynamic inline follow-up suggestion chips immediately below the response bubble */}
                                        {msg.role === "assistant" && index === chatMessages.length - 1 && !chatLoading && (
                                            <div className="copilot-message-followups">
                                                {getSuggestions().map((followup) => (
                                                    <button
                                                        key={followup}
                                                        type="button"
                                                        onClick={() => sendChatMessage(followup)}
                                                        className="followup-pill"
                                                    >
                                                        {followup}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                {/* Typing Indicator dots */}
                                {chatLoading && (
                                    <div className="chat-message-bubble-wrapper assistant typing-loader-row">
                                        <div className="message-text-bubble typing-dots-bubble">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef}></div>
                            </div>
                        )}
                    </div>

                    {/* Tiny outline quick actions prefixes row */}
                    {result && (
                        <div className="copilot-quick-actions-row">
                            {[
                                { label: "Explain", query: "Explain why this draft angle was recommended." },
                                { label: "Compare", query: "Compare this recommendation with common NADCA standards." },
                                { label: "Optimize", query: "Suggest optimizations to improve manufacturability." },
                                { label: "Standards", query: "Show applicable pressure die casting standards." },
                                { label: "Efficiency", query: "How can I improve ejection efficiency and reduce die wear?" }
                            ].map((act) => (
                                <button
                                    key={act.label}
                                    type="button"
                                    disabled={chatLoading}
                                    onClick={() => setChatInput(act.query)}
                                    className="quick-action-pill"
                                >
                                    {act.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Spotlight search bar style input tray */}
                    <div className="spotlight-input-container">
                        <div className="spotlight-input-wrapper">
                            {/* Premium Left WandSparkles SVG */}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spotlight-left-icon">
                                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" />
                                <path d="M5 3l1 2.5L8.5 6L6 7l-1 2.5L2.5 7L5 6z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={result ? "Ask about manufacturability or engineering trade-offs..." : "Generate a recommendation first to activate Copilot"}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && chatInput.trim()) {
                                        sendChatMessage(chatInput);
                                    }
                                }}
                                disabled={chatLoading || !result}
                                className="spotlight-text-input"
                            />
                            <button
                                type="button"
                                disabled={chatLoading || !chatInput.trim() || !result}
                                onClick={() => sendChatMessage(chatInput)}
                                className={`spotlight-send-btn ${chatLoading ? "loading-active" : ""}`}
                            >
                                {chatLoading ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="send-btn-spinner-svg">
                                        <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spotlight-send-icon">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    {chatError && <div className="chat-error-banner">{chatError}</div>}
                </section>

                {/* Refined full-width timeline ledger section below grid */}
                <section className="history-timeline-section full-width-section">
                    <div className="panel-headline-row">
                        <h2>Recent Workspace Runs</h2>
                        <p>Historical casting taper specifications saved during this session. Select any run to load parameters.</p>
                    </div>
                    
                    <div className="history-timeline-cards">
                        {history.length ? (
                            history.map((entry) => (
                                <button 
                                    key={entry._id} 
                                    type="button"
                                    onClick={() => {
                                        if (entry.inputs) {
                                            setForm(entry.inputs);
                                        }
                                    }}
                                    className="timeline-history-row clickable-ledger-row"
                                >
                                    <div className="timeline-dot-connector">
                                        <div className="t-dot"></div>
                                    </div>
                                    <div className="timeline-history-body">
                                        <div className="h-time">
                                            {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}) : "Just Now"}
                                        </div>
                                        <div className="h-complexity-info">
                                            <strong>{entry.inputs?.geometryComplexity} Geometry</strong>
                                            <span className="h-sub-details">
                                                {entry.inputs?.wallDepthMm}mm • {entry.inputs?.surfaceType} • {entry.inputs?.material || "Al-alloy"}
                                            </span>
                                        </div>
                                        <div className="h-confidence-badge">
                                            {entry.output?.confidence}% confidence
                                        </div>
                                        <div className="h-recommended-angle">
                                            {entry.output?.draftAngle}°
                                        </div>
                                        <div className="h-chevron-arrow">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="no-history-text">Adjust parameters to populate workspace runs history.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Advisor;
