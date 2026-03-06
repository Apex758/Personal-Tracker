'use client';

import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Tooltip, Cell, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { ChartPoint } from '@/lib/types';

const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];

export function BarChartCard({ title, data }: { title: string; data: ChartPoint[] }) {
  return (
    <div className="card chart-card">
      <div className="section-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PieChartCard({ title, data }: { title: string; data: ChartPoint[] }) {
  return (
    <div className="card chart-card">
      <div className="section-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={60} outerRadius={92} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
