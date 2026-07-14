import React, { useState, useEffect, useRef } from "react";

export default function LandingPage({ onLaunch }) {
    const [theme, setThemeState] = useState(() => localStorage.getItem("theme") || "system");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    const updateTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
        const isDark = newTheme === "dark" || (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute("content", isDark ? "#121212" : "#FAF9F6");
        }
    };

    // Close settings popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
        };
        if (settingsOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsOpen]);

    // 3D CAD block state
    const [draftSlider, setDraftSlider] = useState(1.5);
    const [rotation, setRotation] = useState({ x: -20, y: 35 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const dragRotationStart = useRef({ x: 0, y: 0 });

    // Timeline observer state
    const [activeTimelineStep, setActiveTimelineStep] = useState(0);
    const timelineRef = useRef(null);

    // Metrics animation state
    const [metrics, setMetrics] = useState({ speed: 0, confidence: 0, precision: 0, engine: 0 });
    const metricsRef = useRef(null);
    const [metricsVisible, setMetricsVisible] = useState(false);

    // Handle CAD rotation via drag
    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        dragRotationStart.current = { ...rotation };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - dragStart.current.x;
            const deltaY = e.clientY - dragStart.current.y;
            setRotation({
                x: dragRotationStart.current.x - deltaY * 0.5,
                y: dragRotationStart.current.y + deltaX * 0.5
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, rotation]);

    // Intersection Observers for timelines & counters
    useEffect(() => {
        const timeline = timelineRef.current;
        if (!timeline) return;

        const steps = timeline.querySelectorAll(".timeline-node-point");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const stepIndex = parseInt(entry.target.getAttribute("data-step") || "0", 10);
                        setActiveTimelineStep(stepIndex);
                    }
                });
            },
            { threshold: 0.6, rootMargin: "-10% 0px -40% 0px" }
        );

        steps.forEach((step) => observer.observe(step));
        return () => observer.disconnect();
    }, []);

    // Metrics counter animation
    useEffect(() => {
        const currentMetricsRef = metricsRef.current;
        if (!currentMetricsRef) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !metricsVisible) {
                    setMetricsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(currentMetricsRef);
        return () => observer.disconnect();
    }, [metricsVisible]);

    useEffect(() => {
        if (!metricsVisible) return;

        let startTimestamp = null;
        const duration = 1600; // ms

        const animate = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function outQuad
            const ease = progress * (2 - progress);

            setMetrics({
                speed: Math.floor(ease * 94) + 4, // Final: 98ms
                confidence: Math.floor(ease * 95), // Final: 95%
                precision: parseFloat((ease * 0.5).toFixed(1)), // Final: 0.5°
                engine: Math.floor(ease * 100) // Final: 100%
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [metricsVisible]);

    // Smooth scroll helper
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="landing-page">
            {/* Header / Navbar */}
            <header className="landing-header">
                <div className="nav-container">
                    <div className="logo-section">
                        <svg className="logo-svg" viewBox="0 0 24 24" fill="none">
                            <path d="M4 18L12 6L20 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 6V20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 3"/>
                        </svg>
                        <span className="logo-text">DraftAngle<span className="logo-sub">Advisor</span></span>
                        <span className="badge-v">v1.0.0 Stable</span>
                    </div>
                    <nav className="nav-links">
                        <button onClick={() => scrollToSection("technology")} className="nav-link">Technology</button>
                        <button onClick={() => scrollToSection("process")} className="nav-link">Workflow</button>
                        <button onClick={() => scrollToSection("features")} className="nav-link">Calculations</button>
                        <button onClick={() => scrollToSection("why-works")} className="nav-link">Architecture</button>
                    </nav>
                    <div className="nav-actions">
                        <button onClick={onLaunch} className="btn-primary-sm">Launch Advisor</button>
                        
                        <div className="settings-wrapper" ref={settingsRef}>
                            <button 
                                type="button" 
                                className={`btn-nav-settings ${settingsOpen ? "active" : ""}`} 
                                title="Settings Preferences"
                                onClick={() => setSettingsOpen(!settingsOpen)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="settings-gear-svg">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </button>
                            
                            {settingsOpen && (
                                <div className="settings-popover">
                                    <div className="settings-popover-title">Preferences</div>
                                    <div className="settings-popover-row">
                                        <span className="settings-popover-label">Interface Theme</span>
                                        <div className="theme-segmented-control">
                                            <button 
                                                type="button" 
                                                className={`theme-segment-btn ${theme === "system" ? "selected" : ""}`}
                                                onClick={() => updateTheme("system")}
                                            >
                                                System
                                            </button>
                                            <button 
                                                type="button" 
                                                className={`theme-segment-btn ${theme === "light" ? "selected" : ""}`}
                                                onClick={() => updateTheme("light")}
                                            >
                                                Light
                                            </button>
                                            <button 
                                                type="button" 
                                                className={`theme-segment-btn ${theme === "dark" ? "selected" : ""}`}
                                                onClick={() => updateTheme("dark")}
                                            >
                                                Dark
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="landing-hero-section">
                <div className="landing-container hero-grid">
                    <div className="hero-left">
                        <div className="eyebrow-accent">PRECISION MANUFACTURING & AI SYSTEM</div>
                        <h1 className="hero-title">
                            Engineering Precision.<br />
                            <span className="gradient-text">Powered by AI.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Determine casting draft tapers with absolute reliability. Our platform merges deterministic physics heuristics with Large Language Models to deliver optimal draft angles alongside auditable, natural-language engineering explanations.
                        </p>
                        <div className="hero-ctas">
                            <button onClick={onLaunch} className="btn-primary-lg">Try the Advisor</button>
                            <button onClick={() => scrollToSection("technology")} className="btn-secondary-lg">Learn More</button>
                        </div>
                        <div className="hero-bullets">
                            <div className="bullet-item">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="bullet-icon"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" /></svg>
                                <span>Aluminum Casting Tolerances (NADCA standard-aligned)</span>
                            </div>
                            <div className="bullet-item">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="bullet-icon"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" /></svg>
                                <span>Zero-hallucination deterministic heuristics</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="cad-viewer-container">
                            <div className="cad-viewer-header">
                                <div className="cad-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <span className="cad-filename">die_cast_core_cavity.step</span>
                                <span className="cad-active-flag">CAD Live Canvas</span>
                            </div>
                            
                            <div 
                                className="cad-canvas"
                                onMouseDown={handleMouseDown}
                                style={{ cursor: isDragging ? "grabbing" : "grab" }}
                            >
                                <div className="cad-grid-lines"></div>
                                <div className="cad-axes">
                                    <span className="axis-lbl x">X</span>
                                    <span className="axis-lbl y">Y</span>
                                    <span className="axis-lbl z">Z</span>
                                </div>
                                
                                {/* 3D Model Outer Space */}
                                <div 
                                    className="cad-3d-scene"
                                    style={{
                                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                                    }}
                                >
                                    {/* 3D CAD Block */}
                                    <div className="cad-block-3d">
                                        {/* Back Face */}
                                        <div className="face back" />
                                        {/* Bottom Face */}
                                        <div className="face bottom" />
                                        {/* Left Face */}
                                        <div className="face left" style={{ transform: `rotateY(-90deg) translateZ(80px) skewX(${-draftSlider * 4}deg)` }} />
                                        {/* Right Face */}
                                        <div className="face right" style={{ transform: `rotateY(90deg) translateZ(80px) skewX(${draftSlider * 4}deg)` }} />
                                        {/* Front Face */}
                                        <div className="face front" style={{ transform: `translateZ(80px) skewY(${draftSlider * 2}deg)` }} />
                                        {/* Top Face */}
                                        <div className="face top" style={{ transform: `translateY(-80px) rotateX(90deg) scale(${1 - draftSlider * 0.05})` }} />
                                        
                                        {/* CAD Nominal Outline (0 deg Reference) */}
                                        <div className="wireframe-nominal" />
                                        
                                        {/* Dynamic Angle Callout */}
                                        <div className="cad-callout-taper" style={{ transform: `translateZ(85px) translateY(-50px) translateX(${40 + draftSlider * 10}px)` }}>
                                            <span className="callout-arrow"></span>
                                            <span className="callout-text">Draft: {draftSlider}°</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="cad-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9M3 12a9 9 0 0 1 9-9"/></svg>
                                    Drag canvas to rotate CAD model
                                </div>
                            </div>

                            <div className="cad-viewer-controls">
                                <div className="slider-group">
                                    <label>Taper Angle Control (Draft)</label>
                                    <div className="slider-wrapper">
                                        <span className="range-min">0.0°</span>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="3" 
                                            step="0.5" 
                                            value={draftSlider} 
                                            onChange={(e) => setDraftSlider(parseFloat(e.target.value))}
                                        />
                                        <span className="range-max">3.0°</span>
                                    </div>
                                </div>
                                <div className="cad-metrics-inline">
                                    <div className="c-metric">
                                        <span>Galling Risk</span>
                                        <strong className={draftSlider <= 0.5 ? "risk-high" : draftSlider <= 1.5 ? "risk-medium" : "risk-low"}>
                                            {draftSlider <= 0.5 ? "CRITICAL" : draftSlider <= 1.5 ? "MODERATE" : "SAFE RELEASE"}
                                        </strong>
                                    </div>
                                    <div className="c-metric">
                                        <span>Wall Tolerance</span>
                                        <strong>{(100 - (draftSlider * 12)).toFixed(0)}% Nominal</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted Technology Section */}
            <section id="technology" className="tech-section">
                <div className="landing-container">
                    <div className="section-header centered">
                        <span className="section-eyebrow">Engineered Architecture</span>
                        <h2 className="section-title">Verified Core Technologies</h2>
                        <p className="section-desc">
                            We don't rely on generic generative prompts to guess tolerances. We utilize a split architecture combining absolute rules with context synthesis.
                        </p>
                    </div>

                    <div className="tech-grid">
                        <div className="tech-card">
                            <div className="tech-icon-container">
                                <svg viewBox="0 0 24 24" className="tech-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            </div>
                            <h3>Deterministic Heuristic Rules</h3>
                            <p>Computes angles based strictly on wall depth ratios, geometry complexity, and ejection drag calculations matching standard foundry handbooks.</p>
                        </div>
                        <div className="tech-card">
                            <div className="tech-icon-container">
                                <svg viewBox="0 0 24 24" className="tech-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                            </div>
                            <h3>AI Manufacturing Assistant</h3>
                            <p>Connects to the Groq API utilizing Llama-3 models to interpret computed values and write context-specific, professional engineering rationales.</p>
                        </div>
                        <div className="tech-card">
                            <div className="tech-icon-container">
                                <svg viewBox="0 0 24 24" className="tech-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                            </div>
                            <h3>MongoDB Persistence</h3>
                            <p>Logs audit-ready records of every query, parameter set, risk flag, and confidence evaluation to build a database of casting runs for downstream review.</p>
                        </div>
                        <div className="tech-card">
                            <div className="tech-icon-container">
                                <svg viewBox="0 0 24 24" className="tech-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                            </div>
                            <h3>Real-time Local Calculations</h3>
                            <p>Delivers mathematical results instantly. Falls back to deterministic templates if the Groq server is offline, maintaining 100% platform availability.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Process Timeline */}
            <section id="process" className="timeline-section">
                <div className="landing-container">
                    <div className="section-header centered">
                        <span className="section-eyebrow">The Calculation Flow</span>
                        <h2 className="section-title">Linear Processing Steps</h2>
                        <p className="section-desc">
                            Witness how casting input variables are transformed into verifiable, high-precision recommendations.
                        </p>
                    </div>

                    <div className="timeline-layout" ref={timelineRef}>
                        {/* Center Path Line */}
                        <div className="timeline-spine">
                            <div 
                                className="timeline-spine-progress"
                                style={{ height: `${(activeTimelineStep / 4) * 100}%` }}
                            ></div>
                        </div>

                        {/* Timeline Nodes */}
                        <div className={`timeline-node ${activeTimelineStep === 0 ? "active" : ""}`}>
                            <div className="timeline-node-point" data-step="0">1</div>
                            <div className="timeline-node-content">
                                <h3>Input Parameters</h3>
                                <p>Provide material choices, wall depth dimensions in millimeters, geometry details, and ejector cylinder speed variables.</p>
                                <span className="timeline-badge">Client View</span>
                            </div>
                        </div>

                        <div className={`timeline-node ${activeTimelineStep === 1 ? "active" : ""}`}>
                            <div className="timeline-node-point" data-step="1">2</div>
                            <div className="timeline-node-content">
                                <h3>Engineering Rules Engine</h3>
                                <p>Heuristic formulas calculate physical tolerances, applying mathematical multipliers for internal surface shrink tension.</p>
                                <span className="timeline-badge code">Express Logic</span>
                            </div>
                        </div>

                        <div className={`timeline-node ${activeTimelineStep === 2 ? "active" : ""}`}>
                            <div className="timeline-node-point" data-step="2">3</div>
                            <div className="timeline-node-content">
                                <h3>AI Rationale Generation</h3>
                                <p>Groq's API translates complex thermodynamic friction indices and structural angles into high-fidelity engineer explanations.</p>
                                <span className="timeline-badge ai">Groq API</span>
                            </div>
                        </div>

                        <div className={`timeline-node ${activeTimelineStep === 3 ? "active" : ""}`}>
                            <div className="timeline-node-point" data-step="3">4</div>
                            <div className="timeline-node-content">
                                <h3>Confidence Analysis</h3>
                                <p>Penalty-based computations determine risk probabilities, generating visual warnings on sidewall accuracy degradation.</p>
                                <span className="timeline-badge safety">Risk Assessor</span>
                            </div>
                        </div>

                        <div className={`timeline-node ${activeTimelineStep === 4 ? "active" : ""}`}>
                            <div className="timeline-node-point" data-step="4">5</div>
                            <div className="timeline-node-content">
                                <h3>Draft Recommendation</h3>
                                <p>The computed value is rounded to casting standard increments and returned as a deployable production-ready angle.</p>
                                <span className="timeline-badge output">Result</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase */}
            <section id="features" className="features-showcase-section">
                <div className="landing-container">
                    <div className="section-header centered">
                        <span className="section-eyebrow">Calculations In Action</span>
                        <h2 className="section-title">Visual Safety Metrics</h2>
                        <p className="section-desc">
                            Explore the core design systems driving safe release parameters and geometric verification.
                        </p>
                    </div>

                    {/* Feature 1 */}
                    <div className="feature-row">
                        <div className="feature-info">
                            <div className="feature-icon-badge">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            </div>
                            <h3>Intelligent Draft Calculations</h3>
                            <p>
                                Internal surfaces shrink tightly onto steel cores as aluminum alloys solidify. This increases withdrawal friction significantly. External surfaces, by contrast, shrink away from the cavity walls, requiring half as much taper.
                            </p>
                            <ul className="feature-list-check">
                                <li>Automatic addition of +0.5° for internal surfaces</li>
                                <li>Subtle -0.25° adjustment for mirror-polished dies</li>
                                <li>Increments up to +0.5° for deeper draws</li>
                            </ul>
                        </div>
                        <div className="feature-visual">
                            <div className="svg-frame">
                                <svg viewBox="0 0 400 300" width="100%" height="100%">
                                    <defs>
                                        <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#e2e8f0" />
                                            <stop offset="100%" stopColor="#94a3b8" />
                                        </linearGradient>
                                        <linearGradient id="taper-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(124,154,122,0.3)" />
                                            <stop offset="100%" stopColor="rgba(124,154,122,0.01)" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid background */}
                                    <pattern id="minor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                    </pattern>
                                    <rect width="100%" height="100%" fill="url(#minor-grid)" />
                                    
                                    {/* Nominal outline */}
                                    <line x1="150" y1="50" x2="150" y2="250" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <line x1="250" y1="50" x2="250" y2="250" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                                    
                                    {/* Taper area */}
                                    <polygon points="150,50 120,250 280,250 250,50" fill="url(#metal-grad)" />
                                    <polygon points="150,50 150,250 120,250" fill="url(#taper-grad)" />
                                    <polygon points="250,50 250,250 280,250" fill="url(#taper-grad)" />

                                    {/* Taper outline */}
                                    <line x1="150" y1="50" x2="120" y2="250" stroke="#7C9A7A" strokeWidth="3" />
                                    <line x1="250" y1="50" x2="280" y2="250" stroke="#7C9A7A" strokeWidth="3" />
                                    <line x1="120" y1="250" x2="280" y2="250" stroke="#7C9A7A" strokeWidth="1.5" />
                                    <line x1="150" y1="50" x2="250" y2="50" stroke="#7C9A7A" strokeWidth="1.5" />

                                    {/* Measurement marks */}
                                    <path d="M120,260 L120,270 M150,260 L150,270" stroke="#64748b" strokeWidth="1" />
                                    <line x1="120" y1="265" x2="150" y2="265" stroke="#64748b" strokeWidth="1" />
                                    <circle cx="135" cy="265" r="2" fill="#64748b" />

                                    <text x="135" y="282" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="sans-serif">Taper Area</text>
                                    <text x="200" y="160" textAnchor="middle" fontSize="14" fill="#232725" fontWeight="bold" fontFamily="sans-serif">Casting Core Block</text>
                                    <text x="100" y="120" textAnchor="end" fontSize="12" fill="#7C9A7A" fontWeight="bold" fontFamily="sans-serif">Draft Angle</text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-row reverse">
                        <div className="feature-info">
                            <div className="feature-icon-badge">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                            </div>
                            <h3>Confidence & Risk Assessor</h3>
                            <p>
                                Extreme draft angles (too steep or too shallow) carry manufacturing implications. Safe operations calculate confidence indexes by tracking geometric deviations.
                            </p>
                            <div className="confidence-preview-indicator">
                                <div className="gauge-mock">
                                    <div className="gauge-bar">
                                        <div className="gauge-fill" style={{ width: "92%" }}></div>
                                    </div>
                                    <div className="gauge-labels">
                                        <span>Optimal Range (0.5° - 2.0°)</span>
                                        <strong>92% Confidence</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="feature-visual">
                            <div className="svg-frame">
                                <svg viewBox="0 0 400 300" width="100%" height="100%">
                                    {/* Grid background */}
                                    <rect width="100%" height="100%" fill="url(#minor-grid)" />
                                    
                                    {/* Gauge semicircle */}
                                    <path d="M 100 200 A 100 100 0 0 1 300 200" fill="none" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
                                    
                                    {/* Active Gauge slice */}
                                    <path d="M 100 200 A 100 100 0 0 1 270 130" fill="none" stroke="url(#gauge-grad)" strokeWidth="24" strokeLinecap="round" />
                                    
                                    <defs>
                                        <linearGradient id="gauge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#ECE9E2" />
                                            <stop offset="50%" stopColor="#A2A29C" />
                                            <stop offset="100%" stopColor="#7C9A7A" />
                                        </linearGradient>
                                    </defs>

                                    {/* Needle */}
                                    <g transform="translate(200, 200) rotate(55)">
                                        <polygon points="-6,0 0,-90 6,0" fill="#232725" />
                                        <circle cx="0" cy="0" r="14" fill="#232725" />
                                        <circle cx="0" cy="0" r="6" fill="#fff" />
                                    </g>

                                    <text x="200" y="240" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#232725" fontFamily="sans-serif">92%</text>
                                    <text x="200" y="260" textAnchor="middle" fontSize="12" fill="#64748b" fontFamily="sans-serif">FOUNDRY EJECTION CONFIDENCE</text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-row">
                        <div className="feature-info">
                            <div className="feature-icon-badge">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <h3>Team Audit History</h3>
                            <p>
                                Maintain total compliance. Our database tracks casting histories, storing user configurations, materials, and calculation steps in an structured, searchable ledger.
                            </p>
                            <ul className="feature-list-check">
                                <li>Audit logs accessible by mold designers</li>
                                <li>Tracks LLM vs Heuristic calculation modes</li>
                                <li>Stores material compounds (Al-Si, Al-Cu, etc.)</li>
                            </ul>
                        </div>
                        <div className="feature-visual">
                            <div className="mock-ledger-card">
                                <div className="ledger-row header">
                                    <span>Part Model</span>
                                    <span>Calculated Draft</span>
                                    <span>Confidence</span>
                                </div>
                                <div className="ledger-row">
                                    <div>
                                        <strong>GearBox_Core_Lid</strong>
                                        <small>Al-Alloy | 32mm wall</small>
                                    </div>
                                    <span className="l-angle">1.5°</span>
                                    <span className="l-status high">High</span>
                                </div>
                                <div className="ledger-row">
                                    <div>
                                        <strong>Valve_Piston_Body</strong>
                                        <small>Silicon Alum | 12mm wall</small>
                                    </div>
                                    <span className="l-angle">0.5°</span>
                                    <span className="l-status high">High</span>
                                </div>
                                <div className="ledger-row">
                                    <div>
                                        <strong>Bracket_Internal_Rib</strong>
                                        <small>Al-Alloy | 48mm wall</small>
                                    </div>
                                    <span className="l-angle">2.5°</span>
                                    <span className="l-status med">Medium</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Metrics Section */}
            <section className="metrics-section" ref={metricsRef}>
                <div className="landing-container">
                    <div className="metrics-wrapper">
                        <div className="metric-box">
                            <div className="m-number">&lt;{metrics.speed}ms</div>
                            <div className="m-label">Analysis Synthesis Speed</div>
                        </div>
                        <div className="metric-box">
                            <div className="m-number">{metrics.confidence}%</div>
                            <div className="m-label">Foundry Release Confidence</div>
                        </div>
                        <div className="metric-box">
                            <div className="m-number">{metrics.precision}°</div>
                            <div className="m-label">Taper Resolution Precision</div>
                        </div>
                        <div className="metric-box">
                            <div className="m-number">{metrics.engine}%</div>
                            <div className="m-label">Rule-Based Audit Engine</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why It Works Section */}
            <section id="why-works" className="why-works-section">
                <div className="landing-container">
                    <div className="section-header centered">
                        <span className="section-eyebrow">Reliability Framework</span>
                        <h2 className="section-title">Why It Works</h2>
                        <p className="section-desc">
                            We solve the primary bottleneck of modern manufacturing software: combining compliance safety with readable synthesis.
                        </p>
                    </div>

                    <div className="explanation-grid">
                        <div className="explanation-text-block">
                            <h3>Deterministic Calculation</h3>
                            <p>
                                Calculations are handled strictly by mathematical formulas based on industry foundry norms (e.g. NADCA handbook principles). We do not send calculations to the LLM. The calculated values are final, consistent, and fully auditable.
                            </p>
                            
                            <h3>Explainable AI Synthesis</h3>
                            <p>
                                We utilize the Groq Llama completion endpoints solely to generate natural language explanations of the math. If the API key is not present, our app triggers a fallback text compiler, guaranteeing zero calculation failures.
                            </p>
                        </div>
                        
                        <div className="architecture-svg-container">
                            <div className="svg-frame">
                                <svg viewBox="0 0 400 300" width="100%" height="100%">
                                    <rect width="100%" height="100%" fill="url(#minor-grid)" />
                                    
                                    {/* Process block 1: Input */}
                                    <rect x="30" y="110" width="80" height="80" rx="12" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
                                    <text x="70" y="145" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#232725" fontFamily="sans-serif">Casting</text>
                                    <text x="70" y="160" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="sans-serif">Parameters</text>

                                    {/* Arrow splits */}
                                    <path d="M 110 150 L 150 90 L 190 90" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                                    <path d="M 110 150 L 150 210 L 190 210" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />

                                    {/* Block 2A: Math Engine */}
                                    <rect x="190" y="50" width="100" height="80" rx="12" fill="#EEF4ED" stroke="#7C9A7A" strokeWidth="1.5" />
                                    <text x="240" y="85" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#232725" fontFamily="sans-serif">Math Engine</text>
                                    <text x="240" y="100" textAnchor="middle" fontSize="10" fill="#444A46" fontFamily="sans-serif">Heuristic calculations</text>

                                    {/* Block 2B: Groq AI */}
                                    <rect x="190" y="170" width="100" height="80" rx="12" fill="#FAF9F6" stroke="#A2A29C" strokeWidth="1.5" />
                                    <text x="240" y="205" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#232725" fontFamily="sans-serif">Groq LLM</text>
                                    <text x="240" y="220" textAnchor="middle" fontSize="10" fill="#444A46" fontFamily="sans-serif">Contextual reasoning</text>

                                    {/* Arrow merges */}
                                    <path d="M 290 90 L 320 120 L 320 130" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                                    <path d="M 290 210 L 320 180 L 320 170" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                                    {/* Block 3: Final Output */}
                                    <rect x="280" y="130" width="80" height="40" rx="8" fill="#232725" />
                                    <text x="320" y="155" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff" fontFamily="sans-serif">Draft Angle</text>

                                    {/* Marker for arrows */}
                                    <defs>
                                        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                                        </marker>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="final-cta-section">
                <div className="landing-container">
                    <div className="cta-banner">
                        <div className="cta-mesh-glow"></div>
                        <h2>Start Optimizing Your Castings.</h2>
                        <p>
                            Integrate physical foundry rules with automated explanations. Calculate draft angles in seconds, fully documented for production.
                        </p>
                        <button onClick={onLaunch} className="btn-cta-launch">
                            Launch Draft Angle Advisor
                            <svg className="cta-arrow-svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
          </section>
            
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <h2 className="footer-heading">Engineering Draft Angle Advisor</h2>
                            <p className="footer-subtitle">AI-powered Draft Angle Recommendation Platform for Manufacturing Engineers.</p>
                            <p className="footer-section-label">DESIGNED & DEVELOPED BY</p>
                            <div className="footer-chips">
                                <span className="footer-chip">Tejas</span>
                                <span className="footer-chip">Shreyas</span>
                                <span className="footer-chip">Sandesh</span>
                                <span className="footer-chip">Tanay</span>
                            </div>
                        </div>
                        <div className="footer-col">
                            <p className="footer-section-label">ACADEMIC PROJECT</p>
                            <p className="footer-college">R V College of Engineering</p>
                            <p className="footer-location">Bangalore, Karnataka<br />India</p>
                            <p className="footer-year">2026</p>
                        </div>
                    </div>
                    <hr className="footer-divider" />
                    <div className="footer-bottom">
                        <p className="footer-copy">© 2026 Engineering Draft Angle Advisor</p>
                        <div className="footer-tech-badges">
                            <span className="footer-tech-badge">React</span>
                            <span className="footer-tech-badge">Node.js</span>
                            <span className="footer-tech-badge">MongoDB</span>
                            <span className="footer-tech-badge">Groq AI</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
