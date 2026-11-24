import type { AdminSession } from '@admin/lib/auth';
import { NAV_TOGGLE_ID } from '@admin/lib/nav';
import AdminNav from './AdminNav';
import LogoutButton from './LogoutButton';
import { Icon, StatusBadge, UiProvider } from './ui';
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
      {/* small screens: this hidden checkbox opens / closes the sidebar (CSS only; AdminNav unchecks it on navigation) */}
      <input id={NAV_TOGGLE_ID} type="checkbox" className={styles.navToggle} aria-hidden tabIndex={-1} />
      <aside className={styles.sidebar}>
        <div className={styles.brand}>پنل مدیریت</div>
        <AdminNav access={{ allPermissions: session.allPermissions, permissions: session.permissions }} />
      </aside>
      <label htmlFor={NAV_TOGGLE_ID} className={styles.backdrop} aria-hidden />
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerStart}>
            <label htmlFor={NAV_TOGGLE_ID} className={styles.menuButton} title="منو">
              <Icon name="menu" size={22} />
              <span className={styles.srOnly}>منو</span>
            </label>
            <span>Autoparts</span>
          </div>
          <div className={styles.actions}>
            <span className={styles.user} title={`${user.username} · ${user.role.name}`}>
              {user.fullName}{' '}
              <span className={styles.role}>
                <StatusBadge tone="info">{user.role.name}</StatusBadge>
              </span>
            </span>
            {/* plain <a>: the store is another root layout (full page load) */}
            <a className={styles.siteLink} href="/" target="_blank" rel="noreferrer">
              مشاهده سایت
            </a>
            <LogoutButton className={styles.logout} />
          </div>
        </header>
        <main className={styles.content}>
          {/* toasts + confirm dialog for every panel page (components/ui/UiProvider) */}
          <UiProvider>{children}</UiProvider>
        </main>
      </div>
    </div>
  );
}
