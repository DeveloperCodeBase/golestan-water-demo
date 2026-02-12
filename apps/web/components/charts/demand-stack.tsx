"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DemandStackChart({
  data
}: {
  data: Array<{ day: string; drinking: number; environment: number; industry: number; agriculture: number }>;
}) {
  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="drinking" name="شرب" stackId="1" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.45} />
          <Area type="monotone" dataKey="environment" name="محیط‌زیست" stackId="1" stroke="#0f766e" fill="#0f766e" fillOpacity={0.45} />
          <Area type="monotone" dataKey="industry" name="صنعت" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.45} />
          <Area type="monotone" dataKey="agriculture" name="کشاورزی" stackId="1" stroke="#65a30d" fill="#65a30d" fillOpacity={0.45} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
