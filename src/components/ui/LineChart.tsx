"use client";

interface DataPoint { date: string; count: number }

export function LineChart({ data, color = "#E60012", height = 200 }: { data: DataPoint[]; color?: string; height?: number }) {
  const w = 600;
  const h = height;
  const pad = { top: 20, right: 10, bottom: 30, left: 40 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  const max = Math.max(...data.map(d => d.count), 1);
  const yMax = Math.ceil(max * 1.2);

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * pw;
    const y = pad.top + ph - (d.count / yMax) * ph;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = points + ` ${pad.left + pw},${pad.top + ph} ${pad.left},${pad.top + ph}`;

  // Y-axis ticks
  const yTicks = [0, Math.round(yMax / 2), yMax];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((v, i) => {
        const y = pad.top + ph - (v / yMax) * ph;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={pad.left + pw} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" className="text-[9px]" fill="#9ca3af">{v}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill={color} fillOpacity={0.08} />

      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* X-axis labels */}
      {data.filter((_, i) => {
        const step = Math.max(1, Math.floor(data.length / 6));
        return i % step === 0 || i === data.length - 1;
      }).map((d, i) => {
        const origIdx = data.indexOf(d);
        const x = pad.left + (origIdx / Math.max(data.length - 1, 1)) * pw;
        return (
          <text key={i} x={x} y={h - 6} textAnchor="middle" className="text-[9px]" fill="#9ca3af">
            {d.date}
          </text>
        );
      })}
    </svg>
  );
}
