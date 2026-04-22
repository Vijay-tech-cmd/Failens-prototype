import {useState} from "react";
import axios from "axios";
import ResultsDashboard from "./Components/ResultsDashboard";

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sensitiveCol, setSensitiveCol] = useState("gender");

  const runAudit = async () => {
    if (!dataset || !modelFile) {
      alert("Please upload both files first.");
      return;
    }
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("dataset", dataset);
    form.append("model_file", modelFile);
    form.append("sensitive_col", "gender");
    form.append("label_col", "income");
    form.append("sensitive_col", sensitiveCol);

    try{
      const res = await axios.post("http://localhost:8000/audit", form);
      setResults(res.data);
    }catch(err){
      setError("Audit failed. Is your backend running?");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxwidth: 700, margin: "40px auto", fontFamily: "sans-serif", padding: 20}}>
      <h1 style={{ fontSize: 28, marginBottom: 4}}>Fairlens</h1>
      <p style={{ color: "#666", marginBottom: 28}}>AI Bias Audit Tool - upload a model and dataset to detect unfairness</p>

      {/*File uploads*/}
      <div style={{ marginBottom: 12}}>
        <label>Dataset (CSV):</label><br />
        <input type="file" accept=".csv" onChange={e => setDataset(e.target.files[0])}/>
      </div>
      <div style={{ marginBottom: 20}}>
        <label>Model (pkl):</label><br />
        <input type="file" accept="*" onChange={e => setModelFile(e.target.files[0])}/>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Check bias on: </label>
        <select value={sensitiveCol}
          onChange={e => setSensitiveCol(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6 }}>
        <option value="gender">Gender</option>
        <option value="race">Race</option>
        <option value="age">Age</option>
        </select>
      </div>
      <button onClick={runAudit} disabled={loading} style={{ padding: "10px 24px", fontSize: 15, cursor: "pointer", background: "#111", color: "#fff", border: "none", borderRadius: 8}}>
        {loading ? "Analyzing..." : "Run Bias Audit"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Show raw results for now */}
      {results && <ResultsDashboard results={results} />}
    </div>
  );
  }