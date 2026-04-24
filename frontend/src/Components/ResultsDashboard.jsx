import BiasChart from "./BiasChart";

const StatusBadge = ({ status }) => (
    <span style={{
        background: status === "PASS" ? "#dcfce7" : "#fee2f2",
        color: status === "PASS" ? "#166534" : "#991b1b",
        padding: "3px 10px", borderRadius: 20,
        fontSize: 12, fontWeight: 600
    }}>{status}</span>
);

export default function ResultsDashboard({ results }) {
    const dp = results.demographic_parity;
    const eo = results.equalized_odds;

    return (
        <div>
            <div style={{ display: "flex", gap: 12, margin: "16px 0"}}>
                <div style={{ flex:1, background: "#f9f9f9",
                              padding: 16, borderRadius: 10}}>
                    <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px" }}>Demographic Parity Gap</p>
                    <p style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px" }}>{dp.gap_percent}%</p>
                    <StatusBadge status={dp.status} />
                </div>
                <div style={{ flex: 1, background: "#f9f9f9", padding: 16, borderRadius: 10}}>
                    <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px" }}>Equalized Odds Gap</p>
                    <p style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px" }}>{eo.gap_percent}%</p>
                    <StatusBadge status={eo.status} />
                </div>
            </div>

            {/*Bar chart */}
            <BiasChart groupRates={dp.group_rates} />

            {/*AI Report */}
            <div style={{ marginTop: 24, background: "#fffbed",
                          border: "1px solid #fde69a",
                          borderRadius: 10, padding: 16 }}>
                <h3 style={{ margin: "0 0 10px" }}>
                    AI Audit Report
                </h3>
                <p style={{ lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                    {results.ai_report}
                </p>
            </div>
        </div>
    );
    
}