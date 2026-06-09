import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialForm = {
    geometryComplexity: "Simple",
    wallDepthMm: 20,
    surfaceType: "External",
    surfaceFinishRequirement: "Standard",
    material: "Aluminium alloy",
    dieEjectionConditions: "Moderate"
};

const complexityOptions = ["Simple", "Medium", "Complex"];
const surfaceTypeOptions = ["Internal", "External"];
const finishOptions = ["Standard", "Fine", "Polished", "Textured"];
const ejectionOptions = ["Easy", "Moderate", "Difficult"];

function App() {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState("");
    const configError = API_BASE_URL ? "" : "Set VITE_API_BASE_URL in frontend/.env before running the app.";

    useEffect(() => {
        const loadHistory = async () => {
            try {
                if (!API_BASE_URL) {
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/recommendations`);
                if (!response.ok) {
                    return;
                }
                const data = await response.json();
                setHistory(data.slice(0, 5));
            } catch {
                setHistory([]);
            }
        };

        loadHistory();
    }, []);

    const onChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: name === "wallDepthMm" ? value : value
        }));
    };

    const submitForm = async (event) => {
        event.preventDefault();

        if (!API_BASE_URL) {
            setError(configError);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/recommend-draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    wallDepthMm: Number(form.wallDepthMm)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to get recommendation");
            }

            setResult(data);
            setHistory((current) => [
                {
                    _id: data.id || crypto.randomUUID(),
                    inputs: data.inputs,
                    output: {
                        draftAngle: data.draftAngle,
                        explanation: data.explanation,
                        confidence: data.confidence,
                        confidenceLabel: data.confidenceLabel,
                        source: data.source
                    }
                },
                ...current
            ].slice(0, 5));
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="shell">
            <section className="hero">
                <div className="hero-copy">
                    <span className="eyebrow">Pressure die casting</span>
                    <h1>Draft angle guidance for aluminum castings.</h1>
                    <p>
                        Enter geometry and ejection conditions to get a draft-angle recommendation,
                        an engineering explanation, and a confidence estimate.
                    </p>
                </div>
                <div className="hero-panel">
                    <div className="stat-card">
                        <span>Recommended draft</span>
                        <strong>{result ? `${result.draftAngle}°` : "--"}</strong>
                    </div>
                    <div className="stat-card muted">
                        <span>Confidence</span>
                        <strong>{result ? `${result.confidence}%` : "--"}</strong>
                    </div>
                </div>
            </section>

            <section className="grid">
                <form className="panel form-panel" onSubmit={submitForm}>
                    <div className="panel-head">
                        <h2>Inputs</h2>
                        <p>All connections stay environment-driven through Vite and Express.</p>
                    </div>

                    <label>
                        Geometry complexity
                        <select name="geometryComplexity" value={form.geometryComplexity} onChange={onChange}>
                            {complexityOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Wall depth (mm)
                        <input type="number" name="wallDepthMm" min="1" step="0.1" value={form.wallDepthMm} onChange={onChange} />
                    </label>

                    <label>
                        Surface type
                        <select name="surfaceType" value={form.surfaceType} onChange={onChange}>
                            {surfaceTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Surface finish requirement
                        <select name="surfaceFinishRequirement" value={form.surfaceFinishRequirement} onChange={onChange}>
                            {finishOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Material
                        <input name="material" value={form.material} onChange={onChange} />
                    </label>

                    <label>
                        Die ejection conditions
                        <select name="dieEjectionConditions" value={form.dieEjectionConditions} onChange={onChange}>
                            {ejectionOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? "Calculating..." : "Recommend draft angle"}
                    </button>

                    {configError ? <p className="error">{configError}</p> : null}
                    {error ? <p className="error">{error}</p> : null}
                </form>

                <section className="panel result-panel">
                    <div className="panel-head">
                        <h2>Result</h2>
                        <p>Engineered to be deployment-ready with MongoDB storage and Groq-assisted summaries.</p>
                    </div>

                    {result ? (
                        <>
                            <div className="result-badge">
                                <span>{result.confidenceLabel} confidence</span>
                                <strong>{result.draftAngle}°</strong>
                            </div>
                            <p className="explanation">{result.explanation}</p>
                            <div className="risk-list">
                                <h3>Risk notes</h3>
                                <ul>
                                    {(result.risk || []).map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <p className="placeholder">Submit a part description to see the draft recommendation.</p>
                    )}
                </section>
            </section>

            <section className="panel history-panel">
                <div className="panel-head">
                    <h2>Recent recommendations</h2>
                    <p>Stored in MongoDB so the team can inspect prior design decisions.</p>
                </div>
                <div className="history-list">
                    {history.length ? (
                        history.map((entry) => (
                            <article key={entry._id} className="history-item">
                                <div>
                                    <strong>{entry.output?.draftAngle}°</strong>
                                    <span>
                                        {entry.inputs?.geometryComplexity} geometry, {entry.inputs?.wallDepthMm} mm depth
                                    </span>
                                </div>
                                <small>{entry.output?.confidenceLabel} confidence</small>
                            </article>
                        ))
                    ) : (
                        <p className="placeholder">No saved recommendations yet.</p>
                    )}
                </div>
            </section>
        </main>
    );
}

export default App;
