import Link from 'next/link';
import { AreaChartCard, PieChartCard, RadialChartCard, ComposedChartCard } from '@/components/charts';
import { StatCard } from '@/components/stat-card';
import { YearlySummary } from '@/components/yearly-summary';
import { getDashboardData } from '@/lib/data';
import { formatMoney, formatNumber } from '@/lib/format';
import { modules } from '@/lib/modules';
export const dynamic = 'force-dynamic';

const MODULE_ACCENTS: Record<string, string> = {
  finance: '#00d4aa',
  lifestyle: '#f06292',
  skills: '#7c6ef7',
  work: '#f5a623',
  travel: '#38bdf8',
  wishlist: '#c084fc',
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Personal HQ — Overview</p>
          <h1 className="page-title">Your life, at a glance.</h1>
          <p className="muted small" style={{ maxWidth: 480, marginTop: 6 }}>
            Money, habits, skills, work, travel, and purchases — all in one place.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/module/finance" className="btn btn-primary">Open Finance ↗</Link>
          <Link href="/module/work" className="btn btn-secondary">Work Tracker</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <StatCard title="Total Income" value={formatMoney(data.stats.income)} helper={`Balance ${formatMoney(data.stats.balance)}`} accent="#00d4aa" />
        <StatCard title="Savings" value={formatMoney(data.stats.savings)} helper="Savings + emergency" accent="#7c6ef7" />
        <StatCard title="Work Net" value={formatMoney(data.stats.workNet)} helper="Income minus work cost" accent="#f5a623" />
        <StatCard title="Skill Hours" value={formatNumber(data.stats.skillHours)} helper="Logged learning time" accent="#38bdf8" />
      </div>

      {/* Main charts row */}
      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <AreaChartCard title="Finance by Month" data={data.charts.financeByMonth} color="#00d4aa" />
        <PieChartCard title="Work Status Mix" data={data.charts.workStatuses} />
      </div>

      {/* Second charts row */}
      <div className="grid grid-3" style={{ marginBottom: 14 }}>
        <RadialChartCard title="Lifestyle Habits" data={data.charts.lifestyleHabits} />
        <PieChartCard title="Travel Status" data={data.charts.travelStatuses} />
        <ComposedChartCard title="Wishlist Priorities" data={data.charts.wishlistPriorities} />
      </div>

      {/* Yearly Summary */}
      <div style={{ marginBottom: 14 }}>
        <YearlySummary data={data.yearlySummary} />
      </div>

      {/* Modules grid */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Modules</p>
            <p className="section-title">Jump into any area</p>
          </div>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <Link href={`/module/${module.slug}`} key={module.slug} className="module-card">
              <h4 style={{ color: MODULE_ACCENTS[module.slug] }}>{module.label}</h4>
              <p>{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}