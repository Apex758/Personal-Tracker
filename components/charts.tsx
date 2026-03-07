'use client';

import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import type { ChartPoint } from '@/lib/types';

const TEAL = '#00d4aa';
const AMBER = '#f5a623';
const VIOLET = '#7c6ef7';
const ROSE = '#f06292';
const CYAN = '#38bdf8';
const PURPLE = '#c084fc';

const PALETTE = [TEAL, AMBER, VIOLET, ROSE, CYAN, PURPLE, '#4ade80', '#fb923c'];

const tooltipStyle = {
  contentStyle: {
    background: '#141820',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontSize: 12,
    color: '#f0f4ff',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  itemStyle: { color: '#8892a4' },
  labelStyle: { color: '#f0f4ff', fontWeight: 700, fontFamily: 'Syne, sans-serif' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

/* ─── Area Chart ─── */
export function AreaChartCard({
  title,
  data,
  color = TEAL,
  height,
}: {
  title: string;
  data: ChartPoint[];
  color?: string;
  height?: number;
}) {
  const chartH = height ?? 240;
  return (
    <div className="card">
      <div className="card-header">
        <p className="section-title">{title}</p>
      </div>
      <div style={{ height: chartH, transition: 'height 0.3s ease' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#4d5668' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${color.replace('#', '')})`}
              dot={{ fill: color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Bar Chart ─── */
export function BarChartCard({ title, data, color = VIOLET }: { title: string; data: ChartPoint[]; color?: string }) {
  return (
    <div className="card">
      <div className="card-header">
        <p className="section-title">{title}</p>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((entry, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Radial Bar Chart ─── */
export function RadialChartCard({ title, data }: { title: string; data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const radialData = data
    .filter((d) => d.value > 0)
    .slice(0, 6)
    .map((d, i) => ({
      name: d.label,
      value: Math.round((d.value / max) * 100),
      fill: PALETTE[i % PALETTE.length],
    }));

  return (
    <div className="card">
      <div className="card-header">
        <p className="section-title">{title}</p>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={108} data={radialData} barSize={10} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ ...tooltipStyle.contentStyle, padding: '8px 12px' }}>
                    <p style={{ color: d.fill, fontWeight: 700, marginBottom: 2 }}>{d.name}</p>
                    <p style={{ color: '#8892a4', fontSize: 11 }}>Score: {d.value}%</p>
                  </div>
                );
              }}
            />
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#8892a4', fontSize: 11 }}>{value}</span>}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Donut / Pie Chart ─── */
const RADIAN = Math.PI / 180;
function customLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.8)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PieChartCard({ title, data }: { title: string; data: ChartPoint[] }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <div className="card">
      <div className="card-header">
        <p className="section-title">{title}</p>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="46%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={3}
              labelLine={false}
              label={customLabel}
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0];
                return (
                  <div style={{ ...tooltipStyle.contentStyle, padding: '8px 12px' }}>
                    <p style={{ color: '#f0f4ff', fontWeight: 700 }}>{d.name}</p>
                    <p style={{ color: '#8892a4', fontSize: 11 }}>Count: {d.value}</p>
                  </div>
                );
              }}
            />
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#8892a4', fontSize: 11 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const SHORT_MONTHS: Record<string, string> = {
  '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
  '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec',
};
function fmtMonthTick(val: string) {
  if (/^\d{4}-\d{2}$/.test(val)) return SHORT_MONTHS[val.slice(5)] ?? val;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val.slice(8);
  return val;
}

/* ─── Multi-Series Stacked Area Chart ─── */
export function StackedAreaChartCard({
  title,
  data,
  series,
  height,
}: {
  title: string;
  data: Record<string, unknown>[];
  series: { key: string; label: string; color: string }[];
  height?: number;
}) {
  if (!data.length || !series.length) return null;
  const chartH = height ?? 300;

  return (
    <div className="card">
      <div className="card-header">
        <p className="section-title">{title}</p>
      </div>
      <div style={{ height: chartH, transition: 'height 0.3s ease' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`sg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.04} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#4d5668' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtMonthTick}
            />
            <YAxis tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ ...tooltipStyle.contentStyle, padding: '10px 14px', minWidth: 140 }}>
                    <p style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{fmtMonthTick(String(label))}</p>
                    {payload.map((p: any) => (
                      <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ color: '#8892a4', fontSize: 11 }}>{p.name}</span>
                        <span style={{ color: '#f0f4ff', fontSize: 11, marginLeft: 'auto', fontWeight: 600 }}>{p.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#8892a4', fontSize: 11 }}>{value}</span>}
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#sg-${s.key})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ComposedChartCard({ title, data }: { title: string; data: ChartPoint[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <p className="section-title">{title}</p>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="composedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AMBER} stopOpacity={0.3} />
                <stop offset="95%" stopColor={AMBER} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" fill={AMBER} fillOpacity={0.25} radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Line type="monotone" dataKey="value" stroke={AMBER} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}