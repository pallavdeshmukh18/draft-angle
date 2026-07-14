import { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import LandingPage from "./LandingPage.jsx";
import Advisor from "./Advisor.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function AppContent({ view, setView, transitioning, setTransitioning }) {
    const { user } = useAuth();

    // Sync body styling based on active view (light-mode landing/auth vs. dark-mode advisor)
    useEffect(() => {
        const body = document.body;
        if (view === "landing" || view === "login" || view === "register") {
            body.classList.remove("advisor-active");
            body.classList.add("landing-active");
        } else {
            body.classList.remove("landing-active");
            body.classList.add("advisor-active");
        }
    }, [view]);

    // Animate view transition
    const navigateTo = (nextView) => {
        setTransitioning(true);
        setTimeout(() => {
            setView(nextView);
            setTransitioning(false);
            window.scrollTo({ top: 0, behavior: "instant" });
        }, 600);
    };

    const handleLaunch = () => {
        if (user) {
            navigateTo("advisor");
        } else {
            navigateTo("login");
        }
    };

    return (
        <div className={`app-view-container ${transitioning ? "transitioning-active" : ""}`}>
            {view === "landing" && (
                <div className={`view-wrapper ${transitioning ? "slide-out" : "slide-in"}`}>
                    <LandingPage onLaunch={handleLaunch} />
                </div>
            )}
            {view === "login" && (
                <div className={`view-wrapper ${transitioning ? "fade-out" : "fade-in"}`}>
                    <Login onViewChange={navigateTo} />
                </div>
            )}
            {view === "register" && (
                <div className={`view-wrapper ${transitioning ? "fade-out" : "fade-in"}`}>
                    <Register onViewChange={navigateTo} />
                </div>
            )}
            {view === "advisor" && (
                <ProtectedRoute onViewChange={setView}>
                    <div className={`view-wrapper ${transitioning ? "fade-out" : "fade-in"}`}>
                        <Advisor onBack={() => navigateTo("landing")} />
                    </div>
                </ProtectedRoute>
            )}
        </div>
    );
}

export default function App() {
    const [view, setView] = useState("landing");
    const [transitioning, setTransitioning] = useState(false);

    return (
        <AuthProvider onViewChange={setView}>
            <AppContent 
                view={view} 
                setView={setView} 
                transitioning={transitioning} 
                setTransitioning={setTransitioning} 
            />
        </AuthProvider>
    );
}
