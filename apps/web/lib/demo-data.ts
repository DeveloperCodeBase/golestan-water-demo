export const kpisMock = {
  storage: 782,
  level: 114.2,
  inflow: 146,
  demandSatisfaction: 89,
  envFlow: 26,
  riskIndex: 0.34
};

const ONE_DAY = 24 * 60 * 60 * 1000;

export const lineSeriesMock = Array.from({ length: 14 }).map((_, idx) => {
  const ts = new Date(Date.now() - (13 - idx) * ONE_DAY);
  return {
    day: ts.toLocaleDateString("fa-IR-u-ca-persian", { month: "short", day: "numeric" }),
    inflow: 108 + Math.sin(idx / 2) * 24 + idx * 1.4,
    outflow: 86 + Math.cos(idx / 3) * 16 + idx * 0.8,
    storage: 710 + idx * 5.6 + Math.sin(idx / 2.3) * 11
  };
});

export const demandStackMock = Array.from({ length: 12 }).map((_, idx) => ({
  day: `هفته ${idx + 1}`,
  drinking: 50 + (idx % 2) * 3,
  environment: 22 + (idx % 3),
  industry: 30 + (idx % 4),
  agriculture: 74 + (idx % 5) * 4
}));

export const runRowsMock = Array.from({ length: 10 }).map((_, idx) => ({
  id: `run-${idx + 1}`,
  scenario: ["wet", "normal", "dry"][idx % 3],
  horizon: [7, 14, 30][idx % 3],
  satisfaction: 0.78 + (idx % 5) * 0.03,
  risk: 0.25 + (idx % 4) * 0.1,
  created_at: new Date(Date.now() - idx * 86400000).toISOString()
}));
