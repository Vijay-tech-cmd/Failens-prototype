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
    <div className="app-container" style={{ maxWidth: 900, margin: "40px auto", fontFamily: "'Inter', sans-serif", padding: "0 20px" }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px", marginBottom: 10, background: "linear-gradient(90deg, #111, #555)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          FairLens
        </h1>
        <p style={{ color: "#666", fontSize: 18 }}>
          Advanced AI Bias Audit Engine
        </p>
      </header>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", padding: 32, border: "1px solid #eee" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div className="input-group">
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: "#333" }}>Dataset (CSV)</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={e => setDataset(e.target.files[0])}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ddd", background: "#f9f9f9" }}
            />
          </div>
          <div className="input-group">
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: "#333" }}>Model (PKL)</label>
            <input 
              type="file" 
              accept=".pkl,.joblib" 
              onChange={e => setModelFile(e.target.files[0])}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ddd", background: "#f9f9f9" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: "#333" }}>Check bias on column:</label>
          <select 
            value={sensitiveCol}
            onChange={e => setSensitiveCol(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ddd", appearance: "none", background: "white" }}
          >
            <option value="gender">Gender / Sex</option>
            <option value="race">Race</option>
            <option value="age">Age</option>
            <option value="relationship">Relationship Status</option>
          </select>
        </div>

        <button 
          onClick={runAudit} 
          disabled={loading} 
          style={{ 
            width: "100%", 
            padding: "16px", 
            fontSize: 16, 
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", 
            background: "#111", 
            color: "#fff", 
            border: "none", 
            borderRadius: 8,
            transition: "all 0.2s ease",
            transform: loading ? "scale(0.98)" : "scale(1)",
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading ? "Analyzing Bias Patterns..." : "Run AI Audit →"}
        </button>

        {error && (
          <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: "#fff5f5", border: "1px solid #feb2b2", color: "#c53030", fontSize: 14 }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        {results && <ResultsDashboard results={results} />}
      </div>
      
      <footer style={{ textAlign: "center", marginTop: 60, paddingBottom: 40, color: "#aaa", fontSize: 12 }}>
        Built with FairLens Bias Engine &bull; Transparency in AI
      </footer>
    </div>
  );
}