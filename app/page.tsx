import Link from 'next/link';
import { BarChartCard, PieChartCard } from '@/components/charts';
import { StatCard } from '@/components/stat-card';
import { getDashboardData } from '@/lib/data';
import { formatMoney, formatNumber } from '@/lib/format';
import { modules } from '@/lib/modules';

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Your life, work, and money in one place.</h2>
          <p className="muted max-width">
            This is built for your laptop and your phone, and it is meant to sit on Vercel with Supabase as the live database. The workbook remains your backup template and import source.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/module/finance" className="button primary">Open finance</Link>
          <Link href="/module/work" className="button secondary">Open work tracker</Link>
        </div>
      </section>

      <section className="grid grid-4">
        <StatCard title="Income" value={formatMoney(data.stats.income)} helper={`Balance ${formatMoney(data.stats.balance)}`} />
        <StatCard title="Savings" value={formatMoney(data.stats.savings)} helper="Savings + emergency view" />
        <StatCard title="Work net" value={formatMoney(data.stats.workNet)} helper="Actual income minus work expense" />
        <StatCard title="Skill hours" value={formatNumber(data.stats.skillHours)} helper="Tracked learning time" />
      </section>

      <section className="grid grid-2">
        <BarChartCard title="Finance by month" data={data.charts.financeByMonth} />
        <PieChartCard title="Work status mix" data={data.charts.workStatuses} />
      </section>

      <section className="grid grid-3">
        <BarChartCard title="Lifestyle totals" data={data.charts.lifestyleHabits} />
        <PieChartCard title="Travel status" data={data.charts.travelStatuses} />
        <PieChartCard title="Wishlist priorities" data={data.charts.wishlistPriorities} />
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Modules</p>
            <h3>Jump into any area</h3>
          </div>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <Link href={`/module/${module.slug}`} key={module.slug} className="module-card">
              <h4>{module.label}</h4>
              <p className="muted small">{module.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
