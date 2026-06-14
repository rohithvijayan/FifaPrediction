'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import styles from './profile.module.css';

interface UserProfileData {
  total_points: number;
  registered_at: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('total_points, registered_at')
          .eq('uid', user.uid)
          .single();

        if (error) {
          console.error('Error fetching user stats:', error.message);
        } else if (data) {
          setProfileData(data as UserProfileData);
        }
      } catch (err) {
        console.error('Unexpected error fetching user profile:', err);
      } finally {
        setLoadingPoints(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (!user) return null;

  // Extract initials
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '🏆';

  // Format date
  const formatRegDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className={styles.profileContainer}>
      {/* ── Header with Avatar & Total Points ──────────────── */}
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>{initials}</div>
        <h1 className={styles.displayName}>{user.displayName}</h1>
        
        <div className={styles.pointsBadge}>
          <span>⚽ Total Score:</span>
          <strong>
            {loadingPoints ? '...' : (profileData?.total_points ?? 0)} Points
          </strong>
        </div>
      </div>

      {/* ── Details Grid Card ───────────────────────────────── */}
      <div className={styles.detailsCard}>
        <h2 className={styles.cardTitle}>Account details</h2>
        
        <div className={styles.detailsList}>
          {/* Email */}
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Email address</span>
              <span className={styles.detailValue}>{user.email || 'No email provided'}</span>
            </div>
          </div>

          {/* Phone */}
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Phone number</span>
              {user.phone ? (
                <span className={styles.detailValue}>{user.phone}</span>
              ) : (
                <span className={styles.detailValueEmpty}>Not provided</span>
              )}
            </div>
          </div>

          {/* Location / District */}
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Location</span>
              {user.district || user.pincode ? (
                <span className={styles.detailValue}>
                  {user.district || 'N/A'}{user.pincode ? ` (${user.pincode})` : ''}
                </span>
              ) : (
                <span className={styles.detailValueEmpty}>Not provided</span>
              )}
            </div>
          </div>

          {/* Registration Date */}
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Member since</span>
              <span className={styles.detailValue}>
                {loadingPoints ? '...' : (profileData?.registered_at ? formatRegDate(profileData.registered_at) : 'N/A')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sign Out Button ─────────────────────────────────── */}
      <div className={styles.actionArea}>
        <button onClick={signOut} className={styles.logoutBtn}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
