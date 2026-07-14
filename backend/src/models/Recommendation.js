import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        inputs: {
            geometryComplexity: { type: String, required: true },
            wallDepthMm: { type: Number, required: true },
            surfaceType: { type: String, required: true },
            surfaceFinishRequirement: { type: String, required: true },
            material: { type: String, required: true },
            dieEjectionConditions: { type: String, required: true }
        },
        output: {
            draftAngle: { type: Number, required: true },
            explanation: { type: String, required: true },
            risk: { type: [String], default: [] },
            confidence: { type: Number, required: true },
            confidenceLabel: { type: String, required: true },
            source: { type: String, default: "heuristic" }
        }
    },
    { timestamps: true }
);

export const Recommendation = mongoose.model("Recommendation", recommendationSchema);
