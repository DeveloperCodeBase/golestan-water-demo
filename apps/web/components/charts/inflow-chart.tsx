"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function InflowChart({ data }: { data: Array<{ day: string; inflow: number; outflow: number; storage: number }> }) {
  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" opacity={0.3} />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="inflow" name="ورودی" stroke="#0f766e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="outflow" name="خروجی" stroke="#e76f51" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="storage" name="ذخیره" stroke="#1d4ed8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
