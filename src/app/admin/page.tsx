import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Goal Guru admin — manually trigger result settlement.',
};

export default function AdminPage() {
  return (
    <main className="page-content fade-in-up">
      <div className="admin-panel">
        <div className="admin-header">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-error)', fontSize: 28 }}>admin_panel_settings</span>
          <h1 className="admin-title">Admin Panel</h1>
        </div>

        <div className="admin-warning">
          ⚠️ Admin-only area. Actions here directly modify match results and user points.
        </div>

        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14, marginBottom: 'var(--space-lg)' }}>
          Manual result settlement will be available in Sprint 5. Today&apos;s fixtures will appear here.
        </p>

        <div className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-sm)' }} />
        <div className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-sm)' }} />
      </div>
    </main>
  );
}
