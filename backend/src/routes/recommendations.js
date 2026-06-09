import express from "express";
import { Recommendation } from "../models/Recommendation.js";
import { generateGroqExplanation } from "../services/groq.js";
import { recommendDraftAngle } from "../utils/draftRules.js";

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

router.post("/recommend-draft", async (req, res, next) => {
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

router.get("/recommendations", async (req, res, next) => {
    try {
        const items = await Recommendation.find().sort({ createdAt: -1 }).limit(25).lean();
        return res.json(items);
    } catch (error) {
        next(error);
    }
});

export default router;
