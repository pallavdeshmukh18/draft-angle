import React from "react";

export default function GoogleLoginButton({ onStart, onSuccess, onError, onCancel, disabled }) {
    const handleGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, "");

        if (!clientId) {
            onError("Google client configuration VITE_GOOGLE_CLIENT_ID is missing.");
            return;
        }

        onStart();

        const state = Math.random().toString(36).substring(2);
        const redirectUri = encodeURIComponent(`${apiBaseUrl}/api/auth/google/callback`);
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=${state}`;

        console.log("Google OAuth Redirect URI:", `${apiBaseUrl}/api/auth/google/callback`);
        console.log("Google OAuth URL:", authUrl);

        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            authUrl,
            "GoogleSignIn",
            `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );

        if (!popup) {
            onError("Popup blocked. Please allow popups for this website to sign in with Google.");
            return;
        }

        console.log("Google OAuth popup opened successfully.");

        let isResolved = false;

        // Monitor if popup was closed by user without authenticating
        let popupChecker = setInterval(() => {
            if (popup.closed) {
                clearInterval(popupChecker);
                console.log("Popup window closed.");
                setTimeout(() => {
                    if (!isResolved) {
                        window.removeEventListener("message", handleMessage);
                        onCancel();
                    }
                }, 200);
            }
        }, 1000);

        const handleMessage = (event) => {
            // Verify message origin (handles dev host/port/slash variations safely)
            const checkOrigin = event.origin.toLowerCase().trim().replace(/\/+$/, "");
            const expectedOrigin = apiBaseUrl.toLowerCase().trim().replace(/\/+$/, "");
            
            const isLocal = (urlStr) => {
                try {
                    const host = new URL(urlStr).hostname;
                    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
                } catch (e) {
                    return false;
                }
            };

            const isMatch = checkOrigin === expectedOrigin || (isLocal(checkOrigin) && isLocal(expectedOrigin));
            if (!isMatch) return;

            if (event.data.type === "GOOGLE_LOGIN_SUCCESS") {
                console.log("Google Sign-In success detected via postMessage.");
                isResolved = true;
                clearInterval(popupChecker);
                if (event.data.token) {
                    localStorage.setItem("token", event.data.token);
                }
                onSuccess();
                window.removeEventListener("message", handleMessage);
            } else if (event.data.type === "GOOGLE_LOGIN_ERROR") {
                console.error("Google Sign-In error detected via postMessage:", event.data.message);
                isResolved = true;
                clearInterval(popupChecker);
                onError(event.data.message || "Google Sign-In failed.");
                window.removeEventListener("message", handleMessage);
            }
        };

        window.addEventListener("message", handleMessage);
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={disabled}
            className="btn-google-auth-premium"
        >
            <svg className="google-icon-svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
        </button>
    );
}
