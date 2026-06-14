import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.brandText}>
          <Image src="/images/title.png" alt="Panthduniya Logo" width={150} height={40} className={styles.navLogo} />
        </Link>
        <div className={styles.navLinks}>
          <Link href="/fixtures">മത്സരങ്ങൾ</Link>
          <Link href="#">നിയമങ്ങൾ</Link>
        </div>
      </div>
      <div className={styles.navRight}>
        <Link href="/login" className={styles.loginBtn}>LOGIN</Link>
        <Link href="/register" className={styles.signupBtn}>SIGN UP</Link>
      </div>
    </nav>
  );
}
