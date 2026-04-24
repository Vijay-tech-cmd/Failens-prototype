import { useState } from "react";
import axios from "axios";
import ResultsDashboard from "./Components/ResultsDashboard";

const API_BASE_URL = "https://fairlens-api-5ek1.onrender.com";

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sensitiveCol, setSensitiveCol] = useState("gender");

  const runAudit = async () => {
    if (!dataset || !modelFile) {
      setError("Please upload both a Dataset (CSV) and a Model file (PKL) before running the audit.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);

    const form = new FormData();
    form.append("dataset", dataset);
    form.append("model_file", modelFile);
    form.append("sensitive_col", sensitiveCol);
    form.append("label_col", "income");

    try {
      const res = await axios.post(`${API_BASE_URL}/audit`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60s timeout for large models/reports
      });
      setResults(res.data);
    } catch (err) {
      console.error("Audit error details:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError("The request timed out. The backend might be waking up or the model is too large. Please try again in a moment.");
      } else if (!err.response) {
        setError("Network Error: Cannot connect to the FairLens API. This could be due to CORS issues or the backend server being offline.");
      } else {
        setError(err.response?.data?.detail || err.response?.data?.error || "Audit failed. Please check your file formats and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Fairlens</h1>
      <p style={{ color: "#666", marginBottom: 28 }}>AI Bias Audit Tool - upload a model and dataset to detect unfairness</p>

      {/* File uploads */}
      <div style={{ marginBottom: 12 }}>
        <label>Dataset (CSV):</label><br />
        <input type="file" accept=".csv" onChange={e => setDataset(e.target.files[0])} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label>Model (pkl):</label><br />
        <input type="file" accept=".pkl,.joblib" onChange={e => setModelFile(e.target.files[0])} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Check bias on: </label>
        <select value={sensitiveCol}
          onChange={e => setSensitiveCol(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6 }}>
          <option value="gender">Gender</option>
          <option value="race">Race</option>
          <option value="age">Age</option>
          <option value="relationship">Relationship</option>
        </select>
      </div>
      <button onClick={runAudit} disabled={loading} style={{ padding: "12px 28px", fontSize: 16, cursor: loading ? "not-allowed" : "pointer", background: loading ? "#666" : "#111", color: "#fff", border: "none", borderRadius: 8, transition: "all 0.2s" }}>
        {loading ? "Analyzing Bias..." : "Run Bias Audit"}
      </button>

      {loading && (
        <div style={{ marginTop: 24, padding: 20, background: "#f0f7ff", borderRadius: 10, border: "1px solid #cce3ff", textAlign: 'center' }}>
          <p style={{ margin: 0, color: "#0056b3", fontWeight: 600 }}>
            Audit in progress...
          </p>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#666" }}>
            We're computing fairness metrics and generating your AI audit report. This usually takes 15–30 seconds.
          </p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: "#fff5f5", border: "1px solid #feb2b2", color: "#c53030", fontSize: 14 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div style={{ marginTop: 32 }}>
          <ResultsDashboard results={results} />
        </div>
      )}
    </div>
  );
}