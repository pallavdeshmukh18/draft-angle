const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const generateGroqExplanation = async ({ apiKey, model, inputs, recommendation }) => {
    if (!apiKey) {
        return null;
    }

    const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: model || "llama-3.1-8b-instant",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a manufacturing engineer specializing in aluminum pressure die casting. Return concise, practical engineering explanations only."
                },
                {
                    role: "user",
                    content: [
                        "Generate a short engineering explanation for a draft-angle recommendation.",
                        `Inputs: ${JSON.stringify(inputs)}`,
                        `Recommendation: ${JSON.stringify(recommendation)}`,
                        "Include why the draft is recommended and the risk of lower or higher values. Keep it under 120 words."
                    ].join("\n")
                }
            ]
        })
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    return payload?.choices?.[0]?.message?.content?.trim() || null;
};
