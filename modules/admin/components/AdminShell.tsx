import type { AdminSession } from '@admin/lib/auth';
import AdminNav from './AdminNav';
import LogoutButton from './LogoutButton';
import styles from './AdminShell.module.css';

export default function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  const { user } = session;
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>پنل مدیریت</div>
        <AdminNav permissions={session.permissions} />
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <span>Autoparts</span>
          <div className={styles.actions}>
            <span className={styles.user} title={`${user.username} · ${user.role.name}`}>
              {user.fullName}
              <small className={styles.role}>{user.role.name}</small>
            </span>
            {/* plain <a>: the store is another root layout (full page load) */}
            <a className={styles.siteLink} href="/" target="_blank" rel="noreferrer">
              مشاهده سایت
            </a>
            <LogoutButton className={styles.logout} />
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
