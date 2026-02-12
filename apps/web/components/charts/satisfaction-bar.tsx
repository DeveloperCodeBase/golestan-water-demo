"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SatisfactionBar({
  data
}: {
  data: Array<{ sector: string; satisfaction: number }>;
}) {
  return (
    <div className="h-52 w-full sm:h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" opacity={0.2} />
          <XAxis dataKey="sector" />
          <YAxis domain={[0, 1]} />
          <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
          <Bar dataKey="satisfaction" fill="#0ea5a4" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
