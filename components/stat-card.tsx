import { GlareHover } from '@/components/GlareHover';

type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
  accent?: string;
};

export function StatCard({ title, value, helper, accent = '#00d4aa' }: StatCardProps) {
  return (
    <GlareHover
      glareColor="#ffffff"
      glareOpacity={0.18}
      glareAngle={-30}
      glareSize={300}
      transitionDuration={700}
      className="stat-card"
    >
      <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {helper && <div className="stat-helper">{helper}</div>}
    </GlareHover>
  );
}