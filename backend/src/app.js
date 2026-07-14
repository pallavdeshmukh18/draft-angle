import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import recommendationsRouter from "./routes/recommendations.js";
import authRouter from "./routes/auth.js";

export const createApp = () => {
    const app = express();

    app.set("trust proxy", 1);

    // Enable security headers
    app.use(helmet());

    // Sanitize input to protect against NoSQL Injection
    app.use(mongoSanitize());

    const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((value) => value.trim().replace(/\/+$/, "")).filter(Boolean)
        : [];

    const corsOptions = {
        origin: (origin, callback) => {
            // Allow server-to-server or script-based requests without Origin headers (like health checks or server curl)
            if (!origin) return callback(null, true);
            
            const originClean = origin.toLowerCase().trim();
            
            // Check if origin matches configuration, localhost dev ports, or preview vercel deployments
            const isAllowed = allowedOrigins.some(allowed => allowed.toLowerCase() === originClean)
                || originClean.endsWith(".vercel.app")
                || originClean.startsWith("http://localhost:")
                || originClean.startsWith("http://127.0.0.1:");
                
            if (isAllowed) {
                callback(null, true);
            } else {
                callback(new Error(`CORS policy blocked request origin: ${origin}`));
            }
        },
        credentials: true
    };

    app.use(cors(corsOptions));

    // Parse cookie headers for JWT authentication
    app.use(cookieParser());
    
    app.use(express.json({ limit: "1mb" }));

    app.use((req, res, next) => {
        console.log(`[Request] ${req.method} ${req.originalUrl}`);
        next();
    });

    app.get("/", (_req, res) => {
        res.status(200).send("Backend is running");
    });

    app.get("/api/health", (_req, res) => {
        res.json({ ok: true, service: "aluminium-draft-angle-api" });
    });

    // Mount Auth routes
    app.use("/api/auth", authRouter);
    
    // Mount Recommendation routes
    app.use("/api", recommendationsRouter);

    app.use((error, _req, res, _next) => {
        const status = error.status || 500;
        res.status(status).json({
            message: error.message || "Internal server error"
        });
    });

    return app;
};
