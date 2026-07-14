import express from "express";
import { Recommendation } from "../models/Recommendation.js";
import { generateGroqExplanation } from "../services/groq.js";
import { recommendDraftAngle } from "../utils/draftRules.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const toString = (value) => String(value ?? "").trim();

const buildExplanation = (inputs, recommendation) => {
    const lines = [
        `This part is best served by about ${recommendation.draftAngle}° draft because ${inputs.geometryComplexity.toLowerCase()} geometry and a ${inputs.wallDepthMm} mm wall depth raise ejection drag.`,
        `The ${inputs.surfaceType.toLowerCase()} surface increases die contact sensitivity, so a slightly higher draft protects release consistency.`,
        `Using less draft raises the risk of galling, scuffing, or sticking during die release; using more draft can reduce usable wall fidelity and visible side-wall sharpness.`
    ];

    if (recommendation.risk.length) {
        lines.push(`Key risk notes: ${recommendation.risk.join(" ")}`);
    }

    return lines.join(" ");
};

const validateBody = (body) => {
    const geometryComplexity = toString(body.geometryComplexity);
    const wallDepthMm = Number(body.wallDepthMm);
    const surfaceType = toString(body.surfaceType);
    const surfaceFinishRequirement = toString(body.surfaceFinishRequirement);
    const material = toString(body.material);
    const dieEjectionConditions = toString(body.dieEjectionConditions);

    const missing = [];

    if (!geometryComplexity) missing.push("geometryComplexity");
    if (!Number.isFinite(wallDepthMm) || wallDepthMm <= 0) missing.push("wallDepthMm");
    if (!surfaceType) missing.push("surfaceType");
    if (!surfaceFinishRequirement) missing.push("surfaceFinishRequirement");
    if (!material) missing.push("material");
    if (!dieEjectionConditions) missing.push("dieEjectionConditions");

    return {
        ok: missing.length === 0,
        missing,
        body: {
            geometryComplexity,
            wallDepthMm,
            surfaceType,
            surfaceFinishRequirement,
            material,
            dieEjectionConditions
        }
    };
};

router.post("/recommend-draft", requireAuth, async (req, res, next) => {
    try {
        const validation = validateBody(req.body);

        if (!validation.ok) {
            return res.status(400).json({
                message: "Missing or invalid inputs.",
                missing: validation.missing
            });
        }

        const heuristic = recommendDraftAngle(validation.body);
        const baseRecommendation = {
            draftAngle: heuristic.draftAngle,
            confidence: heuristic.confidence,
            confidenceLabel: heuristic.confidenceLabel,
            risk: heuristic.risk
        };

        const groqExplanation = await generateGroqExplanation({
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL,
            inputs: validation.body,
            recommendation: baseRecommendation
        });

        const explanation = groqExplanation || buildExplanation(validation.body, baseRecommendation);
        const payload = {
            user: req.user._id, // Scopes recommendation to the user session
            inputs: validation.body,
            output: {
                ...baseRecommendation,
                explanation,
                source: groqExplanation ? "groq" : "heuristic"
            }
        };

        const saved = await Recommendation.create(payload);

        return res.status(201).json({
            id: saved._id,
            ...payload.output,
            inputs: payload.inputs
        });
    } catch (error) {
        next(error);
    }
});

router.get("/recommendations", requireAuth, async (req, res, next) => {
    try {
        // Scopes history fetch strictly to the active logged-in user
        const items = await Recommendation.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(25).lean();
        return res.json(items);
    } catch (error) {
        next(error);
    }
});

const systemPrompt = `You are a senior manufacturing engineer specializing in aluminum pressure die casting.
You are advising on a specific casting design.

Rules:
1. Never invent draft values.
2. Never override the deterministic calculations provided in the context. The calculated draft is the absolute ground truth.
3. Always explain recommendations using clear mechanical and engineering reasoning.
4. If standards (like NADCA) are referenced, clearly indicate they are general engineering guidance.
5. Prefer concise answers. Use bullet points when appropriate.
6. Explain trade-offs (e.g., draft angle vs side-wall sharpness or ejection wear).
7. Maintain a professional, quiet, authoritative engineering tone. No emojis. No hyperbole.`;

const buildUserPrompt = (message, currentRec) => {
    const inputs = currentRec.inputs || {};
    const output = currentRec.output || currentRec || {};
    return `Context:
- User Inputs:
  * Geometry Complexity: ${inputs.geometryComplexity || "N/A"}
  * Wall Depth: ${inputs.wallDepthMm || "N/A"} mm
  * Surface Orientation: ${inputs.surfaceType || "N/A"}
  * Surface Finish Requirement: ${inputs.surfaceFinishRequirement || "N/A"}
  * Material: ${inputs.material || "N/A"}
  * Die Ejection Conditions: ${inputs.dieEjectionConditions || "N/A"}
- Calculated Draft Angle: ${output.draftAngle || "N/A"}° (Ground Truth)
- Casting Confidence Score: ${output.confidence || "N/A"}%
- Risk Diagnostics: ${output.risk ? output.risk.join(", ") : "None"}
- AI Explanation: ${output.explanation || "N/A"}

User Question: ${message}`;
};

router.post("/chat", requireAuth, async (req, res, next) => {
    try {
        const { message, currentRecommendation, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message is required." });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Groq API key is not configured on the server." });
        }

        const systemMessage = {
            role: "system",
            content: systemPrompt
        };

        const contextUserMessage = {
            role: "user",
            content: buildUserPrompt(message, currentRecommendation || {})
        };

        // Format history for Groq. It must map role to "user" or "assistant".
        const formattedHistory = (history || []).map(h => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content
        }));

        const messages = [
            systemMessage,
            ...formattedHistory,
            contextUserMessage
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
                temperature: 0.3,
                messages
            })
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            throw new Error(errorPayload?.error?.message || "Groq API response error");
        }

        const payload = await response.json();
        const content = payload?.choices?.[0]?.message?.content?.trim() || "";

        return res.json({ content });
    } catch (error) {
        next(error);
    }
});

export default router;
