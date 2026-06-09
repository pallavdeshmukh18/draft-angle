import cors from "cors";
import express from "express";
import recommendationsRouter from "./routes/recommendations.js";

export const createApp = () => {
    const app = express();
    const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((value) => value.trim()).filter(Boolean)
        : true;

    app.use(
        cors({
            origin: allowedOrigins,
            credentials: true
        })
    );
    app.use(express.json({ limit: "1mb" }));

    app.get("/", (_req, res) => {
        res.status(200).send("Backend is running");
    });

    app.get("/api/health", (_req, res) => {
        res.json({ ok: true, service: "aluminium-draft-angle-api" });
    });

    app.use("/api", recommendationsRouter);

    app.use((error, _req, res, _next) => {
        const status = error.status || 500;
        res.status(status).json({
            message: error.message || "Internal server error"
        });
    });

    return app;
};
