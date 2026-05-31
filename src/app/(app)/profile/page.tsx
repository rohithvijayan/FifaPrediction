import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Your Goal Guru stats — points, rank, accuracy, and prediction history.',
};

export default function ProfilePage() {
  return (
    <main className="page-content fade-in-up">
      {/* Profile header skeleton */}
      <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-lg)' }} />

      {/* Career stats skeleton */}
      <div className="career-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />
        ))}
      </div>

      {/* History skeleton */}
      <h3 className="headline-sm" style={{ marginBottom: 'var(--space-md)' }}>History</h3>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-xs)' }} />
      ))}
    </main>
  );
}
