'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';
import { supabase } from '@/lib/supabase/client';
import { Team } from '@/lib/types';

// ─── Country data (dial code + max local digit length) ───────────────────────
const COUNTRIES = [
  { code: 'IN', name: 'India', dial: '+91', digits: 10 },
  { code: 'US', name: 'United States', dial: '+1', digits: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44', digits: 10 },
  { code: 'AU', name: 'Australia', dial: '+61', digits: 9 },
  { code: 'CA', name: 'Canada', dial: '+1', digits: 10 },
  { code: 'AE', name: 'UAE', dial: '+971', digits: 9 },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', digits: 9 },
  { code: 'SG', name: 'Singapore', dial: '+65', digits: 8 },
  { code: 'MY', name: 'Malaysia', dial: '+60', digits: 10 },
  { code: 'PK', name: 'Pakistan', dial: '+92', digits: 10 },
  { code: 'BD', name: 'Bangladesh', dial: '+880', digits: 10 },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', digits: 9 },
  { code: 'NP', name: 'Nepal', dial: '+977', digits: 10 },
  { code: 'DE', name: 'Germany', dial: '+49', digits: 11 },
  { code: 'FR', name: 'France', dial: '+33', digits: 9 },
  { code: 'IT', name: 'Italy', dial: '+39', digits: 10 },
  { code: 'ES', name: 'Spain', dial: '+34', digits: 9 },
  { code: 'BR', name: 'Brazil', dial: '+55', digits: 11 },
  { code: 'MX', name: 'Mexico', dial: '+52', digits: 10 },
  { code: 'ZA', name: 'South Africa', dial: '+27', digits: 9 },
  { code: 'NG', name: 'Nigeria', dial: '+234', digits: 10 },
  { code: 'JP', name: 'Japan', dial: '+81', digits: 10 },
  { code: 'KR', name: 'South Korea', dial: '+82', digits: 10 },
  { code: 'CN', name: 'China', dial: '+86', digits: 11 },
  { code: 'ID', name: 'Indonesia', dial: '+62', digits: 11 },
  { code: 'PH', name: 'Philippines', dial: '+63', digits: 10 },
  { code: 'TH', name: 'Thailand', dial: '+66', digits: 9 },
  { code: 'VN', name: 'Vietnam', dial: '+84', digits: 9 },
  { code: 'QA', name: 'Qatar', dial: '+974', digits: 8 },
  { code: 'KW', name: 'Kuwait', dial: '+965', digits: 8 },
  { code: 'BH', name: 'Bahrain', dial: '+973', digits: 8 },
  { code: 'OM', name: 'Oman', dial: '+968', digits: 8 },
];

export default function RegisterPage() {
  const { user, loading: authLoading, signUp } = useAuth();
  const router = useRouter();

  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone fields
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // default India
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phone, setPhone] = useState('');

  // Location fields
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');

  // Favourite team field
  const [teams, setTeams] = useState<Team[]>([]);
  const [favouriteTeam, setFavouriteTeam] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filtered countries based on search — must be declared before any early return (Rules of Hooks)
  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // Redirect already-authenticated users away from the register page
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/predict');
    }
  }, [user, authLoading, router]);

  // Fetch teams from database for registration selection
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: true });
        if (error) {
          console.error('Error fetching teams:', error.message);
        } else if (data) {
          setTeams(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching teams:', err);
      }
    };
    fetchTeams();
  }, []);

  // Show a minimal spinner while auth state resolves to avoid blank flash
  if (authLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.bgGlow} />
        <div className={styles.bgGlowPink} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(148,163,184,0.2)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </main>
    );
  }

  // Don't render the form if user is already logged in (redirect is in-flight)
  if (user) return null;

  const handlePhoneChange = (val: string) => {
    // Strip non-digits and cap at max length for selected country
    const digits = val.replace(/\D/g, '').slice(0, selectedCountry.digits);
    setPhone(digits);
  };

  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setSelectedCountry(c);
    setDropdownOpen(false);
    setCountrySearch('');
    // Re-validate phone length for new country
    setPhone((prev) => prev.slice(0, c.digits));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (phone && phone.length !== selectedCountry.digits) {
      setError(`Phone number must be exactly ${selectedCountry.digits} digits for ${selectedCountry.name}.`); return;
    }
    if (pincode && !/^\d{4,10}$/.test(pincode)) {
      setError('Pincode must be 4–10 digits.'); return;
    }

    setLoading(true);
    try {
      const fullPhone = phone ? `${selectedCountry.dial}${phone}` : undefined;
      await signUp(
        name.trim(),
        email,
        password,
        fullPhone,
        district.trim() || undefined,
        pincode || undefined,
        favouriteTeam || undefined
      );
      router.push('/predict');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGlowPink} />

      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>← Back</Link>
          <h1 className={styles.title}>Join the Game</h1>
          <p className={styles.subtitle}>Create your account and start predicting</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ── Display Name ─────────────────────────────── */}
          <div className={styles.inputGroup}>
            <label htmlFor="name" className="input-label">Display Name</label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              minLength={2}
            />
          </div>

          {/* ── Email ────────────────────────────────────── */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* ── Password ─────────────────────────────────── */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          {/* ── Phone Number ─────────────────────────────── */}
          <div className={styles.inputGroup}>
            <label htmlFor="phone" className="input-label">
              Phone Number <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.phoneRow}>
              {/* Country selector */}
              <div className={styles.countrySelector}>
                <button
                  type="button"
                  className={styles.countryBtn}
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  aria-label="Select country code"
                >
                  <span className={styles.flag}>
                    {/* Flag emoji via regional indicator letters */}
                    {String.fromCodePoint(
                      ...selectedCountry.code.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
                    )}
                  </span>
                  <span className={styles.dialCode}>{selectedCountry.dial}</span>
                  <svg className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdown} role="listbox">
                    <div className={styles.dropdownSearch}>
                      <input
                        type="text"
                        placeholder="Search country…"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className={styles.dropdownInput}
                        autoFocus
                      />
                    </div>
                    <ul className={styles.dropdownList}>
                      {filteredCountries.length === 0 ? (
                        <li className={styles.dropdownEmpty}>No results</li>
                      ) : (
                        filteredCountries.map((c) => (
                          <li
                            key={c.code}
                            role="option"
                            aria-selected={c.code === selectedCountry.code}
                            className={`${styles.dropdownItem} ${c.code === selectedCountry.code ? styles.dropdownItemActive : ''}`}
                            onClick={() => handleCountrySelect(c)}
                          >
                            <span>
                              {String.fromCodePoint(
                                ...c.code.split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
                              )}
                            </span>
                            <span className={styles.dropdownName}>{c.name}</span>
                            <span className={styles.dropdownDial}>{c.dial}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Phone input */}
              <input
                id="phone"
                type="tel"
                className={`input-field ${styles.phoneInput}`}
                placeholder={`${selectedCountry.digits} digits`}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={selectedCountry.digits}
                autoComplete="tel-national"
                inputMode="numeric"
              />
            </div>
            {phone.length > 0 && (
              <span className={styles.phoneHint}>
                {phone.length}/{selectedCountry.digits} digits
              </span>
            )}
          </div>

          {/* ── District + Pincode (two-column) ──────────── */}
          <div className={styles.rowGroup}>
            <div className={styles.inputGroup}>
              <label htmlFor="district" className="input-label">
                District <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="district"
                type="text"
                className="input-field"
                placeholder="e.g. Kannur"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                autoComplete="address-level2"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="pincode" className="input-label">
                Pincode <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="pincode"
                type="text"
                className="input-field"
                placeholder="e.g. 600001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                autoComplete="postal-code"
              />
            </div>
          </div>

          {/* ── Favourite Team ─────────────────────────── */}
          <div className={styles.inputGroup}>
            <label htmlFor="favouriteTeam" className="input-label">
              Favourite Team <span className={styles.optional}>(optional)</span>
            </label>
            <select
              id="favouriteTeam"
              className="input-field"
              value={favouriteTeam}
              onChange={(e) => setFavouriteTeam(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                color: favouriteTeam ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="" style={{ color: 'var(--text-muted)' }}>Select your favourite team…</option>
              {teams.map((t) => (
                <option key={t.code} value={t.code} style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                  {t.flag_emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : '⚽ START PREDICTING'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link href="/login" className={styles.switchLink}>Log In →</Link>
        </p>
      </div>
    </main>
  );
}
