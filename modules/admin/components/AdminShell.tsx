import Link from 'next/link';
import AdminNav from './AdminNav';
import styles from './AdminShell.module.css';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>پنل مدیریت</div>
        <AdminNav />
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <span>Autoparts</span>
          <div className={styles.actions}>
            {/* plain <a>: the store is another root layout (full page load) */}
            <a className={styles.siteLink} href="/" target="_blank" rel="noreferrer">
              مشاهده سایت
            </a>
            {/* no session yet — later this will clear the auth cookie first */}
            <Link className={styles.logout} href="/admin/login">
              خروج
            </Link>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
