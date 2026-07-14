import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Helper to generate JWT
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is missing.");
    }
    return jwt.sign({ id: userId }, secret, {
        expiresIn: "24h"
    });
};

// Helper to set cookie
const setAuthCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === "production"
        || (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("https://"));
    res.cookie("token", token, {
        httpOnly: true, // Safeguards against XSS attacks
        secure: isProd, // Enforces TLS in production (required for SameSite=None)
        sameSite: isProd ? "none" : "lax", // Allows cross-site credentials transmissions in prod
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/"
    });
};

// Validate password requirements
const isPasswordStrong = (password) => {
    if (password.length < 8) return false;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All registration fields are required." });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }

        if (!isPasswordStrong(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered. Please login." });
        }

        // Hash password
        const passwordHash = await bcryptjs.hash(password, 12);

        // Save User
        const user = await User.create({
            fullName: fullName.trim(),
            email: cleanEmail,
            passwordHash
        });

        // Generate and set token
        const token = generateToken(user._id);
        setAuthCookie(res, token);

        return res.status(201).json({
            message: "Registration successful.",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await bcryptjs.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = generateToken(user._id);
        setAuthCookie(res, token);

        return res.status(200).json({
            message: "Login successful.",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
    return res.status(200).json({
        user: req.user
    });
});

// Helper to render popup callback HTML page with postMessage and window.close
const sendPopupResponse = (res, status, errorMessage = null) => {
    const isSuccess = status === "success";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const payload = isSuccess
        ? `{ type: "GOOGLE_LOGIN_SUCCESS" }`
        : `{ type: "GOOGLE_LOGIN_ERROR", message: ${JSON.stringify(errorMessage || "Google Sign-In failed.")} }`;

    // Relax CSP specifically for this minimal dispatcher HTML to allow inline script execution safely under Helmet
    res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline';");
    // Ensure window.opener is not disowned by Helmet's default Cross-Origin-Opener-Policy
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");

    return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication ${isSuccess ? "Success" : "Error"}</title>
        </head>
        <body>
            <script>
                try {
                    if (window.opener) {
                        window.opener.postMessage(${payload}, ${JSON.stringify(clientUrl)});
                    }
                } catch (err) {
                    console.error("postMessage failed:", err);
                }
                window.close();
            </script>
        </body>
        </html>
    `);
};

// GET /api/auth/google/callback
router.get("/google/callback", async (req, res) => {
    try {
        const { code, error: oauthError } = req.query;

        if (oauthError) {
            return sendPopupResponse(res, "error", oauthError);
        }

        if (!code) {
            return sendPopupResponse(res, "error", "No authorization code provided.");
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const apiBaseUrl = `${req.protocol}://${req.get("host")}`;

        if (!clientId || !clientSecret) {
            return sendPopupResponse(res, "error", "Google Client ID or Client Secret is not configured on the server.");
        }

        // Exchange authorization code for ID token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: `${apiBaseUrl}/api/auth/google/callback`,
                grant_type: "authorization_code"
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.id_token) {
            const errDetails = tokenData.error_description || tokenData.error || "Token exchange failed";
            return sendPopupResponse(res, "error", errDetails);
        }

        // Verify Google ID token signature, issuer, and expiration via Google's tokeninfo API
        const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`);
        const tokenInfo = await tokenInfoResponse.json();

        if (!tokenInfoResponse.ok || tokenInfo.error) {
            const errDetails = tokenInfo.error_description || tokenInfo.error || "ID token verification failed";
            return sendPopupResponse(res, "error", errDetails);
        }

        // Validate Audience, Issuer, and Expiration
        if (tokenInfo.aud !== clientId) {
            return sendPopupResponse(res, "error", "Token audience does not match Client ID.");
        }

        if (tokenInfo.iss !== "accounts.google.com" && tokenInfo.iss !== "https://accounts.google.com") {
            return sendPopupResponse(res, "error", "Token issuer is invalid.");
        }

        const exp = Number(tokenInfo.exp);
        const now = Math.floor(Date.now() / 1000);
        if (now >= exp) {
            return sendPopupResponse(res, "error", "Google authentication token has expired.");
        }

        // Retrieve user attributes
        const { sub, email, name, picture } = tokenInfo;
        const cleanEmail = String(email).trim().toLowerCase();

        let user = await User.findOne({ email: cleanEmail });
        if (user) {
            // Automatically link the Google account
            let updated = false;
            if (!user.googleId) {
                user.googleId = sub;
                updated = true;
            }
            if (user.provider !== "google") {
                user.provider = "google";
                updated = true;
            }
            if (picture && user.avatar !== picture) {
                user.avatar = picture;
                updated = true;
            }
            if (updated) {
                await user.save();
            }
        } else {
            // Create user
            user = await User.create({
                fullName: name ? name.trim() : cleanEmail.split("@")[0],
                email: cleanEmail,
                googleId: sub,
                provider: "google",
                avatar: picture || ""
            });
        }

        // Issue JWT token and distribute via cookie
        const jwtToken = generateToken(user._id);
        setAuthCookie(res, jwtToken);

        return sendPopupResponse(res, "success");
    } catch (err) {
        console.error("Google Auth Error:", err);
        return sendPopupResponse(res, "error", "Server encountered an error processing Google login.");
    }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
    const isProd = process.env.NODE_ENV === "production"
        || (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("https://"));
    res.cookie("token", "", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        expires: new Date(0), // Instantly expire the cookie
        path: "/"
    });
    return res.status(200).json({ message: "Logout successful." });
});

export default router;
