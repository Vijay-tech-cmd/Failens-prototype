import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";

export default function BiasChart({ groupRates }) {
    const data = Object.entries(groupRates).map(([group, rate]) => ({ group, rate }));

    const maxRate = Math.max(...data.map(d => d.rate));

    return (
        <div>
            <h3 style={{ marginBottom: 8}}>
                Approval Rate by Group
            </h3>
            <BarChart width={500} height={280} data={data}>
                <XAxis dataKey="group" />
                <YAxis domain={[0, 100]}
                    tickFormatter={v => v + "%"} />
                <Tooltip formatter={v => v + "%"} />
                <ReferenceLine y={maxRate - 5}
                    stroke="#ef4444" strokeDasharray="4 4"
                    label={{ value: "Fairness Threshold", position: "right", fontSize: 11 }} />
                <Bar dataKey="rate" radius={[4,4,0,0]}>
                    {data.map((entry, i) => (
                        <Cell key={i}
                           fill={entry.rate >= maxRate - 5 ? "#ef4444" : "#22c55e"} />
                    ))}
                </Bar>
            </BarChart>
        </div>
    );
}