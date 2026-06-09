const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const roundToHalf = (value) => Math.round(value * 2) / 2;

const normalized = (value) => String(value ?? "").trim().toLowerCase();

const complexityBase = {
    simple: 0.5,
    medium: 1,
    complex: 1.5
};

const finishAdjustment = (finish) => {
    const value = normalized(finish);

    if (!value) {
        return 0;
    }

    if (value.includes("mirror") || value.includes("polish") || value.includes("fine")) {
        return -0.25;
    }

    if (value.includes("textured") || value.includes("rough")) {
        return 0.25;
    }

    return 0;
};

const ejectionAdjustment = (condition) => {
    const value = normalized(condition);

    if (!value) {
        return 0;
    }

    if (value.includes("easy") || value.includes("smooth")) {
        return -0.25;
    }

    if (value.includes("difficult") || value.includes("tight") || value.includes("sticking")) {
        return 0.25;
    }

    if (value.includes("moderate") || value.includes("normal")) {
        return 0;
    }

    return 0;
};

const depthAdjustment = (depth) => {
    const value = Number(depth);

    if (!Number.isFinite(value)) {
        return 0;
    }

    if (value <= 15) {
        return 0;
    }

    if (value <= 30) {
        return 0.25;
    }

    if (value <= 45) {
        return 0.5;
    }

    return 0.5;
};

const surfaceAdjustment = (surfaceType) => {
    const value = normalized(surfaceType);

    if (value.includes("internal")) {
        return 0.5;
    }

    return 0;
};

const riskNotes = (draftAngle, inputs) => {
    const notes = [];

    if (draftAngle <= 1) {
        notes.push("Lower drafts may improve nominal geometry but increase scuffing and sticking risk in deeper pulls.");
    }

    if (draftAngle >= 2.5) {
        notes.push("Higher drafts improve release but can affect visible sidewall appearance and usable wall profile.");
    }

    if (Number(inputs.wallDepthMm) > 35) {
        notes.push("Deep walls need extra draft to protect ejection, especially when the surface is internal.");
    }

    if (normalized(inputs.surfaceType).includes("internal")) {
        notes.push("Internal surfaces usually require more draft because die contact and withdrawal friction are higher.");
    }

    return notes;
};

export const recommendDraftAngle = (inputs) => {
    const base = complexityBase[normalized(inputs.geometryComplexity)] ?? 1;
    const draft = roundToHalf(
        clamp(
            base + depthAdjustment(inputs.wallDepthMm) + surfaceAdjustment(inputs.surfaceType) + finishAdjustment(inputs.surfaceFinishRequirement) + ejectionAdjustment(inputs.dieEjectionConditions),
            0.5,
            3
        )
    );

    const confidencePenalty =
        (normalized(inputs.geometryComplexity) ? 0 : 0.12) +
        (Number.isFinite(Number(inputs.wallDepthMm)) ? 0 : 0.12) +
        (normalized(inputs.surfaceType) ? 0 : 0.08) +
        (normalized(inputs.surfaceFinishRequirement) ? 0 : 0.08) +
        (normalized(inputs.dieEjectionConditions) ? 0 : 0.1);

    const confidence = clamp(0.92 - confidencePenalty - Math.max(0, draft - 2.5) * 0.04, 0.55, 0.95);
    const risk = riskNotes(draft, inputs);

    return {
        draftAngle: draft,
        confidence: Math.round(confidence * 100),
        confidenceLabel: confidence >= 0.85 ? "High" : confidence >= 0.7 ? "Medium" : "Low",
        risk
    };
};
